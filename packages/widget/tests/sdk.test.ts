import { describe, it, expect } from 'vitest';
import { createWidgetState } from '../src/sdk';

describe('Katauser Widget State & SDK Core', () => {
  it('initializes with default closed state and feedback tab', () => {
    const state = createWidgetState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTab).toBe('feedback');
    expect(state.unreadCount).toBe(0);
  });

  it('toggles open and closed state', () => {
    const state = createWidgetState();
    state.open();
    expect(state.isOpen).toBe(true);

    state.close();
    expect(state.isOpen).toBe(false);

    state.toggle();
    expect(state.isOpen).toBe(true);
  });

  it('switches between tabs', () => {
    const state = createWidgetState();
    state.setActiveTab('roadmap');
    expect(state.activeTab).toBe('roadmap');

    state.setActiveTab('changelog');
    expect(state.activeTab).toBe('changelog');

    state.setActiveTab('messages');
    expect(state.activeTab).toBe('messages');
  });

  it('stores workspace configuration and identified user', () => {
    const state = createWidgetState();
    state.init({ workspace: 'acme-corp', apiUrl: 'https://api.katauser.com' });
    expect(state.workspaceId).toBe('acme-corp');
    expect(state.apiUrl).toBe('https://api.katauser.com');

    state.setUser({
      userId: 'usr_789',
      email: 'member@acme.com',
      name: 'Member Acme',
      verified: true,
    });
    expect(state.user?.userId).toBe('usr_789');
    expect(state.user?.verified).toBe(true);
  });
});
