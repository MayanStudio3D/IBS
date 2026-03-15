import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { maskCPFCNPJ, maskPhone, maskCNPJ } from './masks';

interface OrcamentoData {
  id: string;
  cliente_nome: string;
  cliente_documento?: string;
  cliente_endereco?: string;
  vendedor_nome: string;
  data: string;
  validade: string;
  items: any[];
  total_m2: number;
  total_valor: number;
  condicao_pgto: string;
  parcelas: any[];
  empresa?: {
    logo_url?: string;
    subtitulo?: string;
    cnpj?: string;
    ie?: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    empresa_pix?: string;
    empresa_banco?: string;
  };
}
const formatAddress = (addressJson: string | undefined): string => {
  if (!addressJson) return 'Não informado';
  try {
    const addr = typeof addressJson === 'string' ? JSON.parse(addressJson) : addressJson;
    const parts = [];
    if (addr.logradouro) parts.push(addr.logradouro);
    if (addr.numero) parts.push(addr.numero);
    if (addr.complemento) parts.push(addr.complemento);
    
    let base = parts.join(', ');
    
    const extra = [];
    if (addr.bairro) extra.push(addr.bairro);
    if (addr.cidade) extra.push(`${addr.cidade}${addr.estado ? `/${addr.estado}` : ''}`);
    if (addr.cep) extra.push(`CEP: ${addr.cep}`);
    
    return base + (extra.length > 0 ? ` - ${extra.join(', ')}` : '');
  } catch (e) {
    return addressJson || 'Não informado';
  }
};

export const generatePDF = async (data: OrcamentoData) => {
  const doc = new jsPDF() as any;
  const primaryColor = [40, 40, 40]; // Dark grey for text
  const accentColor = [180, 180, 180]; // Light grey for lines/borders
  const protocolId = data.id.substring(0, 8).toUpperCase();

  // --- CABEÇALHO (ESTILO LIMPO) ---
  const headerY = 15;
  
  // 1. Logo (Esquerda)
  if (data.empresa?.logo_url) {
    try {
      const img = await loadImage(data.empresa.logo_url);
      doc.addImage(img, 'PNG', 15, headerY, 45, 30);
    } catch (e) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('IBS', 15, headerY + 15);
    }
  } else {
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('IBS', 15, headerY + 15);
  }

  // 2. Dados da Empresa (Centro)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(data.empresa?.subtitulo || 'IMPERIAL BARRA STONES', 65, headerY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  doc.text(data.empresa?.endereco || '', 65, headerY + 11);
  doc.text(`CNPJ: ${maskCNPJ(data.empresa?.cnpj || '')}  |  IE: ${data.empresa?.ie || 'N/A'}`, 65, headerY + 15);
  doc.text(`E-mail: ${data.empresa?.email || ''}`, 65, headerY + 19);
  doc.text(`Telefone: ${maskPhone(data.empresa?.telefone || '')}`, 65, headerY + 23);

  // 3. Orçamento Info & QR Code (Direita)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text('ORÇAMENTO Nº:', 150, headerY + 5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(protocolId, 150, headerY + 12);
  
  // QR Code (Simulado via Google Charts ou placeholder)
  // Usaremos uma URL que gera o QR code com a chave PIX se disponível
  if (data.empresa?.empresa_pix) {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data.empresa.empresa_pix)}`;
      const qrImg = await loadImage(qrUrl);
      doc.addImage(qrImg, 'PNG', 175, headerY - 2, 22, 22);
      doc.setFontSize(6);
      doc.text('Pague via PIX', 186, headerY + 23, { align: 'center' });
    } catch (e) {
      console.warn('QR Code generation skipped');
    }
  }

  // --- DADOS DO CLIENTE ---
  const clientY = 55;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  doc.rect(15, clientY, 180, 45); // Moldura
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 18, clientY + 6);
  doc.line(15, clientY + 8, 195, clientY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`NOME/RAZÃO: ${data.cliente_nome}`, 18, clientY + 14);
  doc.text(`CPF/CNPJ: ${data.cliente_documento ? maskCPFCNPJ(data.cliente_documento) : 'N/A'}`, 18, clientY + 19);
  
  const addr = formatAddress(data.cliente_endereco);
  const addrLines = doc.splitTextToSize(`ENDEREÇO: ${addr}`, 100);
  doc.text(addrLines, 18, clientY + 24);

  // Coluna Direita (Dados do Pedido)
  doc.text(`DATA: ${data.data}`, 130, clientY + 14);
  doc.text(`VALIDADE: ${data.validade}`, 130, clientY + 19);
  doc.text(`VENDEDOR: ${data.vendedor_nome.toUpperCase()}`, 130, clientY + 24);

  // --- TABELA DE MATERIAIS ---
  const tableStartY = clientY + 50;
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIÇÃO DO MATERIAL', 105, tableStartY - 5, { align: 'center' });

  const tableRows = data.items.length > 0 ? data.items.map(item => [
    item.quantidade.toFixed(2), // Mostramos a área como QTD principal no PDF
    item.descricao.toUpperCase(),
    `${item.comprimento} x ${item.altura}`,
    `R$ ${item.preco_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `R$ ${(item.m2_total * item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]) : [['-', 'SEM ITENS REGISTRADOS', '-', '-', '-']];

  autoTable(doc, {
    startY: tableStartY,
    head: [['QTD (M²)', 'DESCRIÇÃO', 'DIMENSÕES', 'UNIDADE', 'TOTAL']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- CONDIÇÕES E TOTAL ---
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, currentY, 120, 35); // Box Condições
  doc.rect(140, currentY, 55, 35); // Box Total

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDIÇÕES DE PAGAMENTO:', 18, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.condicao_pgto, 18, currentY + 12);
  
  if (data.condicao_pgto === 'PARCELADO' && data.parcelas && data.parcelas.length > 0) {
    const parcelasStr = data.parcelas.map((p, i) => `${i+1}ª: ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join(' | ');
    const pLines = doc.splitTextToSize(parcelasStr, 110);
    doc.text(pLines, 18, currentY + 18);
    doc.setFontSize(6);
    doc.text(`Vencimento inicial: ${data.parcelas[0]?.vencimento.split('-').reverse().join('/')}`, 18, currentY + 30);
  }

  doc.setFontSize(10);
  doc.text('TOTAL:', 145, currentY + 10);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`R$ ${data.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 190, currentY + 22, { align: 'right' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`ÁREA TOTAL: ${data.total_m2.toFixed(2)} M²`, 145, currentY + 30);

  currentY += 45;

  // --- PROTOCOLO DE APROVAÇÃO (RODAPÉ) ---
  const footerStartY = 240;
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([2, 1], 0);
  doc.line(15, footerStartY - 5, 195, footerStartY - 5); // Serrilhado
  doc.setLineDashPattern([], 0);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PROTOCOL0 DE APROVAÇÃO', 105, footerStartY + 5, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const termText = `Ciente de todo o material descrito no orçamento de Nº ${protocolId} emitido na data de ${data.data}, dou como aprovado me atentando as medidas detalhadas não restando nenhuma dúvida.`;
  const termLines = doc.splitTextToSize(termText, 170);
  doc.text(termLines, 20, footerStartY + 12);

  doc.line(65, footerStartY + 35, 145, footerStartY + 35); // Linha assinatura
  doc.text('Assinatura do Cliente', 105, footerStartY + 40, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`Impresso em ${new Date().toLocaleString('pt-BR')}`, 15, footerStartY + 50);
  doc.text('- Frete por conta e ordem do adquirente. | Mat. nat. sujeitos a variações.', 105, footerStartY + 50, { align: 'center' });
  doc.text('VIA EMPRESA', 195, footerStartY + 50, { align: 'right' });

  // Download
  doc.save(`IBS_Orcamento_${protocolId}.pdf`);
};

// Helper para carregar imagem
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

