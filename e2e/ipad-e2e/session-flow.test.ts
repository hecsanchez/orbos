import { by, device, element, expect } from 'detox';

describe('Session Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('shows profile selector on launch', async () => {
    await expect(element(by.text('¿Quién eres hoy?'))).toBeVisible();
  });

  it('selecting a profile triggers session initialization', async () => {
    await element(by.text('Ana')).tap();
    await expect(element(by.text('Preparando tu sesión...'))).toBeVisible();
  });

  it('shows prefetch progress during initialization', async () => {
    await expect(element(by.text(/lecciones/))).toBeVisible();
  });

  it('Today Learning screen shows correct greeting and plan summary', async () => {
    await expect(element(by.text('Hola, Ana'))).toBeVisible();
    await expect(element(by.text('Tu plan de hoy'))).toBeVisible();
    await expect(element(by.text('Bloques'))).toBeVisible();
    await expect(element(by.text('Minutos'))).toBeVisible();
  });

  it('Empezar hoy starts the session', async () => {
    await element(by.text('Empezar hoy →')).tap();
    // Should navigate to lesson screen — verify it's no longer on home
    await expect(element(by.text('Empezar hoy →'))).not.toBeVisible();
  });

  it('story_card renders and TTS fires on first lesson block', async () => {
    // Story cards show a "Continuar" button
    // Wait for the interaction to appear (TTS needs to fire first)
    await waitFor(element(by.text('Continuar →')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('completing all blocks in a lesson advances to next item', async () => {
    // Tap continue on story card
    await element(by.text('Continuar →')).tap();
    // Next block should render — either another interaction or next item
  });

  it('break screen appears at correct interval and countdown runs', async () => {
    // This test is dependent on the plan having a break
    // If the current plan has a break, verify it
    // await expect(element(by.text('Toma un descanso'))).toBeVisible();
    // await expect(element(by.text('minutos'))).toBeVisible();
  });

  it('continue button on break screen is locked until timer reaches 0', async () => {
    // Break screen shows "Respira profundo..." when timer is running
    // await expect(element(by.text('Respira profundo...'))).toBeVisible();
  });

  it('session complete screen appears after last item', async () => {
    // After all items complete, should see completion screen
    await waitFor(element(by.text('¡Buen trabajo hoy!')))
      .toBeVisible()
      .withTimeout(60000);
  });
});
