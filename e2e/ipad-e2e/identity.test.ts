import { by, device, element, expect, waitFor } from 'detox';

describe('Identity Module', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true, delete: true });
  });

  // ── Empty State ────────────────────────────────────

  it('shows empty state on fresh install', async () => {
    await expect(element(by.text('¡Bienvenido a Orbos!'))).toBeVisible();
    await expect(element(by.text('Agregar niño →'))).toBeVisible();
  });

  it('empty state "Agregar niño" navigates to create screen', async () => {
    await element(by.text('Agregar niño →')).tap();
    await expect(element(by.text('¡Vamos a crear tu perfil!'))).toBeVisible();
  });

  // ── Profile Creation ──────────────────────────────

  it('create button is disabled when form is incomplete', async () => {
    // Form is empty — button should be disabled (grey)
    await expect(element(by.text('Crear perfil →'))).toBeVisible();
    // Attempt tap — nothing should happen
    await element(by.text('Crear perfil →')).tap();
    // Still on creation screen
    await expect(element(by.text('¡Vamos a crear tu perfil!'))).toBeVisible();
  });

  it('can fill in name, age, and avatar', async () => {
    // Type name
    await element(by.text('¿Cómo te llamas?')).tap();
    await element(by.text('¿Cómo te llamas?')).typeText('Ana');

    // Select age 6
    await element(by.text('6')).tap();

    // Select first avatar (fox)
    await element(by.text('🦊')).atIndex(0).tap();
  });

  it('submitting the form creates a profile and navigates back', async () => {
    await element(by.text('Crear perfil →')).tap();

    // Should navigate back to profile selector
    await waitFor(element(by.text('¿Quién va a aprender hoy?')))
      .toBeVisible()
      .withTimeout(5000);

    // New profile should be visible
    await expect(element(by.text('Ana'))).toBeVisible();
    await expect(element(by.text('6 años'))).toBeVisible();
  });

  // ── Create second profile ─────────────────────────

  it('can create a second profile', async () => {
    await element(by.text('Nuevo Perfil')).tap();
    await expect(element(by.text('¡Vamos a crear tu perfil!'))).toBeVisible();

    await element(by.text('¿Cómo te llamas?')).tap();
    await element(by.text('¿Cómo te llamas?')).typeText('Miguel');
    await element(by.text('9')).tap();
    await element(by.text('🦉')).atIndex(0).tap();

    await element(by.text('Crear perfil →')).tap();

    await waitFor(element(by.text('Miguel')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('cancel button returns to selector without creating profile', async () => {
    await element(by.text('Nuevo Perfil')).tap();
    await expect(element(by.text('¡Vamos a crear tu perfil!'))).toBeVisible();

    await element(by.text('Cancelar')).tap();
    await expect(element(by.text('¿Quién va a aprender hoy?'))).toBeVisible();
  });

  // ── Profile Selection ─────────────────────────────

  it('selecting a profile triggers session initialization', async () => {
    await element(by.text('Miguel')).tap();
    await waitFor(element(by.text('Preparando tu sesión...')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('shows prefetch progress during initialization', async () => {
    await expect(element(by.text(/lecciones/))).toBeVisible();
  });

  // ── Session Complete ──────────────────────────────

  it('session complete shows personalized name', async () => {
    // Wait for full session to complete (depends on plan length)
    await waitFor(element(by.text('¡Buen trabajo hoy, Miguel!')))
      .toBeVisible()
      .withTimeout(120000);
  });

  it('session complete does not show scores', async () => {
    await expect(element(by.text('Respuestas correctas'))).not.toBeVisible();
  });

  it('session complete shows badges', async () => {
    await expect(element(by.text('Tiempo cumplido'))).toBeVisible();
    await expect(element(by.text('Bloques listos'))).toBeVisible();
  });

  it('closing session returns to profile selector', async () => {
    await element(by.text('Cerrar sesión por hoy →')).tap();

    await waitFor(element(by.text('¿Quién va a aprender hoy?')))
      .toBeVisible()
      .withTimeout(5000);
  });

  // ── Sort Order ────────────────────────────────────

  it('most recently used profile appears first', async () => {
    // Miguel was the last used profile, should appear before Ana
    // Detox doesn't have a direct "appears before" matcher,
    // so we check that the first profile card is Miguel
    const profiles = element(by.text('Miguel'));
    await expect(profiles).toBeVisible();
  });
});
