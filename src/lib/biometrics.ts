/**
 * Utilitário para simular autenticação biométrica em PWA (WebAuthn).
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  // Em um PWA real, usaríamos a Credentials Container API (WebAuthn)
  // https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
  
  return new Promise((resolve) => {
    // Simulando o delay do sensor biométrico
    setTimeout(() => {
      const success = window.confirm("Deseja usar o sensor biométrico (FaceID/Impressão Digital) para entrar?");
      resolve(success);
    }, 500);
  });
}

export function isBiometricsAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.PublicKeyCredential);
}
