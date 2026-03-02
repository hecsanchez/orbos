import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

jest.mock('../src/lib/api', () => ({
  getLessonScripts: jest.fn().mockResolvedValue([]),
  getSafetyLogs: jest.fn().mockResolvedValue([]),
}));

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
