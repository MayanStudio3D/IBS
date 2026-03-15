import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportData {
  periodo: string;
  faturamento: number;
  m2_vendido: number;
  taxa_conversao: number;
  top_materiais: any[];
  total_pedidos: number;
}

export const generateReportPDF = (data: ReportData) => {
  const doc = new jsPDF() as any;
  const goldColor = [212, 175, 55];

  // Cabeçalho
  doc.setFillColor(18, 18, 18);
  doc.rect(0, 0, 210, 50, 'F');
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('IBS', 20, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('IMPERIAL BARRA STONE - RELATÓRIO EXECUTIVO', 20, 35);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('CONSOLIDADO MENSAL DE VENDAS', 110, 25);
  doc.setFontSize(10);
  doc.text(`Período: ${data.periodo}`, 110, 35);

  // Métricas de Destaque
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INDICADORES DE DESEMPENHO', 20, 65);
  doc.setDrawColor(212, 175, 55);
  doc.line(20, 67, 190, 67);

  // Cards (Simulados no PDF)
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 75, 55, 30, 'F');
  doc.rect(80, 75, 50, 30, 'F');
  doc.rect(135, 75, 55, 30, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('FATURAMENTO BRUTO', 25, 82);
  doc.text('ÁREA TOTAL (M2)', 85, 82);
  doc.text('TAXA CONVERSÃO', 140, 82);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`R$ ${data.faturamento.toLocaleString('pt-BR')}`, 25, 92);
  doc.text(`${data.m2_vendido.toFixed(2)}`, 85, 92);
  doc.text(`${data.taxa_conversao.toFixed(1)}%`, 140, 92);

  // Ranking de Materiais
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOP 5 MATERIAIS MAIS VENDIDOS', 20, 125);
  doc.line(20, 127, 190, 127);

  const tableRows = data.top_materiais.map((m, i) => [
    `0${i+1}`,
    m.name,
    `R$ ${m.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `${((m.value / data.faturamento) * 100).toFixed(1)}%`
  ]);

  doc.autoTable({
    startY: 135,
    head: [['#', 'MATERIAL', 'VALOR TOTAL', '% DO FATURAMENTO']],
    body: tableRows,
    headStyles: { fillColor: [18, 18, 18], textColor: [212, 175, 55] },
    margin: { left: 20, right: 20 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 20;

  // Notas de BI
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISE DO PERÍODO:', 20, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`- Volume total de ${data.total_pedidos} pedidos processados no sistema IBS.`, 20, finalY + 8);
  doc.text(`- Ticket médio por pedido: R$ ${(data.faturamento / (data.total_pedidos || 1)).toLocaleString('pt-BR')}.`, 20, finalY + 14);

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Gerado automaticamente pelo Sistema de Gestão IBS Portal.', 20, 285);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 285);

  doc.save(`IBS_Relatorio_Vendas_${data.periodo.replace('/', '-')}.pdf`);
};
