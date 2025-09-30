import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders input and shows suggestions list', () => {
    const onChange = jest.fn();
    const onEnter = jest.fn();
    const setShowSuggest = jest.fn();
    const onSelectSuggestion = jest.fn();

    render(
      <SearchBar
        value="abc"
        onChange={onChange}
        onEnter={onEnter}
        isSearching={false}
        suggestions={[{ fid: '1', file_name: 'abc.txt' }]}
        showSuggest={true}
        setShowSuggest={setShowSuggest}
        onSelectSuggestion={onSelectSuggestion}
      />
    );

    const input = screen.getByPlaceholderText('搜索当前文件夹...') as HTMLInputElement;
    expect(input.value).toBe('abc');
    expect(screen.getByText('abc.txt')).toBeInTheDocument();

    fireEvent.click(screen.getByText('abc.txt'));
    expect(onSelectSuggestion).toHaveBeenCalledWith('abc.txt');
  });
});

