import React from 'react';
import { render } from '@testing-library/react';
import Page from '../src/app/page';

// Mock the api module
jest.mock('../src/lib/api', () => ({
  getStudents: jest.fn().mockResolvedValue([]),
}));

describe('Page', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Page />);
    expect(baseElement).toBeTruthy();
  });
});
