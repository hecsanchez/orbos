import { by, device, element, expect, waitFor } from 'detox';

describe('Evidence Capture', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('evidence screen shows mode selector with audio and photo options', async () => {
    // Navigate to a session with phenomenon_evidence item
    // For E2E we assume a test student with a phenomenon evidence plan item
    await element(by.text('Ana')).tap();

    // Wait for session to load
    await waitFor(element(by.text('Empezar hoy →')))
      .toBeVisible()
      .withTimeout(30000);
    await element(by.text('Empezar hoy →')).tap();

    // Skip through items until we reach evidence (or it may be first)
    await waitFor(element(by.text('Evidencia de Aprendizaje')))
      .toBeVisible()
      .withTimeout(30000);

    await expect(element(by.text('Grabar explicación'))).toBeVisible();
    await expect(element(by.text('Tomar foto'))).toBeVisible();
  });

  it('audio mode shows recording interface', async () => {
    await element(by.text('Grabar explicación')).tap();

    await expect(element(by.text('Graba tu explicación'))).toBeVisible();
    await expect(element(by.text('Grabar'))).toBeVisible();
    await expect(element(by.text('← Cambiar modo'))).toBeVisible();
  });

  it('audio recording starts and shows duration', async () => {
    await element(by.text('Grabar')).tap();

    // Should show recording duration
    await waitFor(element(by.text('0:03')))
      .toBeVisible()
      .withTimeout(5000);

    // Detener button should be enabled after 3 seconds
    await expect(element(by.text('Detener'))).toBeVisible();
  });

  it('stopping recording shows review phase', async () => {
    await element(by.text('Detener')).tap();

    await expect(element(by.text(/Grabación lista/))).toBeVisible();
    await expect(element(by.text('Escuchar'))).toBeVisible();
    await expect(element(by.text('Grabar de nuevo'))).toBeVisible();
    await expect(element(by.text('Listo ✓'))).toBeVisible();
  });

  it('submit stores evidence and advances session', async () => {
    await element(by.text('Listo ✓')).tap();

    // After submit, session should advance — evidence screen should disappear
    await waitFor(element(by.text('Evidencia de Aprendizaje')))
      .not.toBeVisible()
      .withTimeout(10000);
  });
});
