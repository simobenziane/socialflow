import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentPreviewCard } from '@/components/ContentPreviewCard';
import type { ContentItem, ContentStatus } from '@/api/types';

// ============================================
// MOCK DATA FIXTURES
// ============================================

const mockPhotoItem: ContentItem = {
  content_id: 'test_001',
  client_slug: 'berlin-doner',
  batch_name: 'december',
  media_type: 'photo',
  file: 'photo_001.jpg',
  media_url: 'https://example.com/photo.jpg',
  preview_url: 'https://example.com/preview.jpg',
  date: '2025-12-10',
  slot: 'feed',
  schedule_at: '2025-12-10T20:00:00Z',
  platforms: 'instagram,tiktok',
  caption_ig: 'Delicious döner fresh from the grill!',
  caption_tt: 'Best döner in Berlin!',
  hashtags_final: '#berlindoner #foodie #döner',
  status: 'NEEDS_REVIEW',
};

const mockVideoItem: ContentItem = {
  ...mockPhotoItem,
  content_id: 'test_002',
  media_type: 'video',
  file: 'video_001.mp4',
  slot: 'story',
  status: 'APPROVED',
};

const mockScheduledItem: ContentItem = {
  ...mockPhotoItem,
  content_id: 'test_003',
  status: 'SCHEDULED',
  late_post_id: 'late_123',
};

const mockItemNoCaption: ContentItem = {
  ...mockPhotoItem,
  content_id: 'test_004',
  caption_ig: '',
  hashtags_final: '',
};

// ============================================
// NULL/UNDEFINED DATA EDGE CASES
// ============================================

describe('ContentPreviewCard - Null/Undefined Safety', () => {
  it('should show "No caption" when caption_ig is null', () => {
    const item = { ...mockPhotoItem, caption_ig: null as unknown as string };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('No caption')).toBeInTheDocument();
  });

  it('should show "No caption" when caption_ig is undefined', () => {
    const item = { ...mockPhotoItem, caption_ig: undefined as unknown as string };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('No caption')).toBeInTheDocument();
  });

  it('should not crash when platforms is empty string', () => {
    const item = { ...mockPhotoItem, platforms: '' };
    expect(() => render(<ContentPreviewCard item={item} />)).not.toThrow();
  });

  it('should not crash when platforms is null', () => {
    const item = { ...mockPhotoItem, platforms: null as unknown as string };
    expect(() => render(<ContentPreviewCard item={item} />)).not.toThrow();
  });

  it('should show placeholder when preview_url is empty string', () => {
    const item = { ...mockPhotoItem, preview_url: '' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByRole('img', { name: 'Photo placeholder' })).toBeInTheDocument();
  });

  it('should show placeholder when preview_url is null', () => {
    const item = { ...mockPhotoItem, preview_url: null as unknown as string };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByRole('img', { name: 'Photo placeholder' })).toBeInTheDocument();
  });

  it('should not show Late.com link for SCHEDULED item without late_post_id', () => {
    const item = { ...mockScheduledItem, late_post_id: undefined };
    render(<ContentPreviewCard item={item} />);
    expect(screen.queryByRole('link', { name: /View in Late.com/i })).not.toBeInTheDocument();
  });

  it('should display "Invalid date" for invalid schedule_at', () => {
    const item = { ...mockPhotoItem, schedule_at: 'not-a-date' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('should display "Invalid date" for empty schedule_at', () => {
    const item = { ...mockPhotoItem, schedule_at: '' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });

  it('should show "Unnamed file" when file is empty', () => {
    const item = { ...mockPhotoItem, file: '' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('Unnamed file')).toBeInTheDocument();
  });

  it('should show "Unnamed file" when file is null', () => {
    const item = { ...mockPhotoItem, file: null as unknown as string };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('Unnamed file')).toBeInTheDocument();
  });
});

// ============================================
// STRING EDGE CASES
// ============================================

describe('ContentPreviewCard - String Edge Cases', () => {
  it('should handle very long file name with truncation', () => {
    const longFileName = 'a'.repeat(100) + '.jpg';
    const item = { ...mockPhotoItem, file: longFileName };
    render(<ContentPreviewCard item={item} />);
    const fileElement = screen.getByTestId('file-name');
    expect(fileElement).toHaveClass('truncate');
  });

  it('should escape HTML tags in caption (XSS prevention)', () => {
    const xssCaption = '<script>alert("xss")</script>';
    const item = { ...mockPhotoItem, caption_ig: xssCaption };
    render(<ContentPreviewCard item={item} />);
    const captionDisplay = screen.getByTestId('caption-display');
    expect(captionDisplay.textContent).toContain('<script>');
    expect(document.querySelectorAll('script').length).toBeLessThanOrEqual(0);
  });

  it('should handle caption with newlines and special chars', () => {
    const specialCaption = 'Line 1\nLine 2\n\tTab here! @mention #tag';
    const item = { ...mockPhotoItem, caption_ig: specialCaption };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
  });

  it('should handle platform with extra whitespace', () => {
    const item = { ...mockPhotoItem, platforms: '  instagram  ,  tiktok  ' };
    render(<ContentPreviewCard item={item} />);
    // Component shows IG and TT badges
    expect(screen.getByText('IG')).toBeInTheDocument();
    expect(screen.getByText('TT')).toBeInTheDocument();
  });

  it('should handle file name with special chars', () => {
    const item = { ...mockPhotoItem, file: 'photo (1) döner_special.jpg' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('photo (1) döner_special.jpg')).toBeInTheDocument();
  });

  it('should handle empty string caption (shows No caption)', () => {
    const item = { ...mockPhotoItem, caption_ig: '' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('No caption')).toBeInTheDocument();
  });
});

// ============================================
// DATE HANDLING
// ============================================

describe('ContentPreviewCard - Date Handling', () => {
  it('should handle valid ISO date in schedule_at', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText(/2025|12/)).toBeInTheDocument();
  });

  it('should handle date in far future (year 2099)', () => {
    const item = { ...mockPhotoItem, schedule_at: '2099-12-31T23:59:59Z' };
    render(<ContentPreviewCard item={item} />);
    // Should not show "Invalid date"
    expect(screen.queryByText('Invalid date')).not.toBeInTheDocument();
  });

  it('should handle date in past', () => {
    const item = { ...mockPhotoItem, schedule_at: '2020-01-01T00:00:00Z' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.queryByText('Invalid date')).not.toBeInTheDocument();
  });
});

// ============================================
// USER INTERACTION EDGE CASES
// ============================================

describe('ContentPreviewCard - User Interactions', () => {
  it('should not crash when clicking Approve with undefined onApprove', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const approveButton = screen.getByRole('button', { name: /Approve/i });
    expect(() => fireEvent.click(approveButton)).not.toThrow();
  });

  it('should not crash when clicking Reject with undefined onReject', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const rejectButton = screen.getByRole('button', { name: /Reject/i });
    expect(() => fireEvent.click(rejectButton)).not.toThrow();
  });

  it('should still enter edit mode when onEditCaption is undefined', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const editButton = screen.getByRole('button', { name: /Edit caption/i });
    fireEvent.click(editButton);
    expect(screen.getByPlaceholderText('Enter caption...')).toBeInTheDocument();
  });

  it('should NOT call onEditCaption when Save is clicked without changes', () => {
    const onEditCaption = vi.fn();
    render(<ContentPreviewCard item={mockPhotoItem} onEditCaption={onEditCaption} />);

    const editButton = screen.getByRole('button', { name: /Edit caption/i });
    fireEvent.click(editButton);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEditCaption).not.toHaveBeenCalled();
  });

  it('should call onEditCaption with empty string when caption cleared', () => {
    const onEditCaption = vi.fn();
    render(<ContentPreviewCard item={mockPhotoItem} onEditCaption={onEditCaption} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEditCaption).toHaveBeenCalledWith(mockPhotoItem, '');
  });

  it('should restore original caption when Cancel is clicked after editing', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: 'New text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    expect(screen.getByPlaceholderText('Enter caption...')).toHaveValue(mockPhotoItem.caption_ig);
  });

  it('should handle very long text (10000 chars) in textarea', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const longText = 'X'.repeat(10000);
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: longText } });

    expect(textarea).toHaveValue(longText);
  });

  it('should not execute HTML pasted into textarea', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: '<img src=x onerror=alert(1)>' } });

    expect(textarea).toHaveValue('<img src=x onerror=alert(1)>');
    expect(document.querySelectorAll('img[onerror]').length).toBe(0);
  });
});

// ============================================
// KEYBOARD NAVIGATION
// ============================================

describe('ContentPreviewCard - Keyboard Navigation', () => {
  it('should cancel edit mode when Escape key is pressed', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(screen.queryByPlaceholderText('Enter caption...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('should restore original caption when Escape is pressed after editing', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: 'Changed text' } });
    fireEvent.keyDown(textarea, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    expect(screen.getByPlaceholderText('Enter caption...')).toHaveValue(mockPhotoItem.caption_ig);
  });

  it('should have all buttons accessible via keyboard', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('tabindex', '-1');
    });
  });

  it('should have focusable buttons in NEEDS_REVIEW state', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    approveButton.focus();
    expect(document.activeElement).toBe(approveButton);
  });
});

// ============================================
// ACCESSIBILITY
// ============================================

describe('ContentPreviewCard - Accessibility', () => {
  it('should have alt text on preview image', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const img = document.querySelector('img');
    expect(img).toHaveAttribute('alt', 'photo_001.jpg');
  });

  it('should have accessible name on Approve button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('should have accessible name on Edit button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Edit caption/i })).toBeInTheDocument();
  });

  it('should have accessible name on Reject button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  it('should have aria-label on textarea in edit mode', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    expect(textarea).toHaveAttribute('aria-label', 'Edit caption');
  });

  it('should have accessible slot badge for feed', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('Feed')).toBeInTheDocument();
  });

  it('should have accessible slot badge for story', () => {
    render(<ContentPreviewCard item={mockVideoItem} />);
    expect(screen.getByText('Story')).toBeInTheDocument();
  });

  it('should have multiple focusable elements in edit mode', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));

    const textarea = screen.getByPlaceholderText('Enter caption...');
    const saveButton = screen.getByRole('button', { name: 'Save' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    expect(textarea).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    expect(textarea).not.toHaveAttribute('tabindex', '-1');
    expect(saveButton).not.toHaveAttribute('tabindex', '-1');
    expect(cancelButton).not.toHaveAttribute('tabindex', '-1');
  });
});

// ============================================
// BASIC RENDERING
// ============================================

describe('ContentPreviewCard - Basic Rendering', () => {
  it('should render file name', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('photo_001.jpg')).toBeInTheDocument();
  });

  it('should render caption text', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('Delicious döner fresh from the grill!')).toBeInTheDocument();
  });

  it('should render schedule date', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText(/2025|12/)).toBeInTheDocument();
  });

  it('should show No caption when caption is empty', () => {
    render(<ContentPreviewCard item={mockItemNoCaption} />);
    expect(screen.getByText('No caption')).toBeInTheDocument();
  });

  it('should render data-testid on card', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByTestId('content-preview-card')).toBeInTheDocument();
  });
});

// ============================================
// MEDIA TYPE
// ============================================

describe('ContentPreviewCard - Media Type', () => {
  it('should show photo placeholder for photo items without preview', () => {
    const itemNoPreview = { ...mockPhotoItem, preview_url: '' };
    render(<ContentPreviewCard item={itemNoPreview} />);
    const placeholder = screen.getByRole('img', { name: 'Photo placeholder' });
    expect(placeholder).toBeInTheDocument();
  });

  it('should show video placeholder for video items without preview', () => {
    const videoNoPreview = { ...mockVideoItem, preview_url: '' };
    render(<ContentPreviewCard item={videoNoPreview} />);
    const placeholder = screen.getByRole('img', { name: 'Video placeholder' });
    expect(placeholder).toBeInTheDocument();
  });
});

// ============================================
// SLOT BADGE
// ============================================

describe('ContentPreviewCard - Slot Badge', () => {
  it('should display feed slot label', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('Feed')).toBeInTheDocument();
  });

  it('should display story slot label', () => {
    render(<ContentPreviewCard item={mockVideoItem} />);
    expect(screen.getByText('Story')).toBeInTheDocument();
  });
});

// ============================================
// PLATFORM BADGES
// ============================================

describe('ContentPreviewCard - Platform Badges', () => {
  it('should display Instagram badge', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('IG')).toBeInTheDocument();
  });

  it('should display TikTok badge', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByText('TT')).toBeInTheDocument();
  });

  it('should display single platform correctly', () => {
    const item = { ...mockPhotoItem, platforms: 'instagram' };
    render(<ContentPreviewCard item={item} />);
    expect(screen.getByText('IG')).toBeInTheDocument();
    expect(screen.queryByText('TT')).not.toBeInTheDocument();
  });

  it('should not crash when platforms is empty', () => {
    const item = { ...mockPhotoItem, platforms: '' };
    expect(() => render(<ContentPreviewCard item={item} />)).not.toThrow();
  });
});

// ============================================
// ACTIONS FOR NEEDS_REVIEW
// ============================================

describe('ContentPreviewCard - Actions for NEEDS_REVIEW', () => {
  it('should show Approve button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('should show Edit button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Edit caption/i })).toBeInTheDocument();
  });

  it('should show Reject button', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
  });

  it('should call onApprove when Approve is clicked', () => {
    const onApprove = vi.fn();
    render(<ContentPreviewCard item={mockPhotoItem} onApprove={onApprove} />);

    // There are two Approve buttons: hover overlay icon and footer button
    // Use getAllByRole and click the first one (footer button has text "Approve")
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    fireEvent.click(approveButtons[0]);
    expect(onApprove).toHaveBeenCalledWith(mockPhotoItem);
  });

  it('should call onReject when Reject is clicked', () => {
    const onReject = vi.fn();
    render(<ContentPreviewCard item={mockPhotoItem} onReject={onReject} />);

    fireEvent.click(screen.getByRole('button', { name: /Reject/i }));
    expect(onReject).toHaveBeenCalledWith(mockPhotoItem);
  });

  it('should not show action buttons for non-NEEDS_REVIEW items', () => {
    render(<ContentPreviewCard item={mockVideoItem} />);
    expect(screen.queryByRole('button', { name: /Approve/i })).not.toBeInTheDocument();
  });
});

// ============================================
// EDIT MODE
// ============================================

describe('ContentPreviewCard - Edit Mode', () => {
  it('should enter edit mode when Edit button is clicked', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));

    expect(screen.getByPlaceholderText('Enter caption...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should cancel edit mode when Cancel is clicked', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
  });

  it('should call onEditCaption when Save is clicked with changed caption', () => {
    const onEditCaption = vi.fn();
    render(<ContentPreviewCard item={mockPhotoItem} onEditCaption={onEditCaption} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    fireEvent.change(textarea, { target: { value: 'New caption!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onEditCaption).toHaveBeenCalledWith(mockPhotoItem, 'New caption!');
  });

  it('should disable Edit button when disabled prop is true', () => {
    render(<ContentPreviewCard item={mockPhotoItem} disabled={true} />);
    const editButton = screen.getByRole('button', { name: /Edit caption/i });
    expect(editButton).toBeDisabled();
  });

  it('should initialize textarea with current caption', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    expect(textarea).toHaveValue(mockPhotoItem.caption_ig);
  });

  it('should initialize textarea with empty string when caption is null', () => {
    const item = { ...mockPhotoItem, caption_ig: null as unknown as string };
    render(<ContentPreviewCard item={item} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit caption/i }));
    const textarea = screen.getByPlaceholderText('Enter caption...');
    expect(textarea).toHaveValue('');
  });
});

// ============================================
// SCHEDULED ITEM ACTIONS
// ============================================

describe('ContentPreviewCard - Scheduled Item Actions', () => {
  it('should show View in Late.com link for scheduled items with late_post_id', () => {
    render(<ContentPreviewCard item={mockScheduledItem} />);
    expect(screen.getByRole('link', { name: /View in Late.com/i })).toBeInTheDocument();
  });

  it('should link to correct Late.com URL', () => {
    render(<ContentPreviewCard item={mockScheduledItem} />);
    const link = screen.getByRole('link', { name: /View in Late.com/i });
    expect(link).toHaveAttribute('href', 'https://app.getlate.dev/posts/late_123');
  });

  it('should not show Late.com link if no late_post_id', () => {
    const scheduledNoId = { ...mockScheduledItem, late_post_id: undefined };
    render(<ContentPreviewCard item={scheduledNoId} />);
    expect(screen.queryByRole('link', { name: /View in Late.com/i })).not.toBeInTheDocument();
  });

  it('should open Late.com link in new tab', () => {
    render(<ContentPreviewCard item={mockScheduledItem} />);
    const link = screen.getByRole('link', { name: /View in Late.com/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

// ============================================
// DISABLED STATE
// ============================================

describe('ContentPreviewCard - Disabled State', () => {
  it('should disable Approve button when disabled prop is true', () => {
    render(<ContentPreviewCard item={mockPhotoItem} disabled={true} />);

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    expect(approveButton).toBeDisabled();
  });

  it('should disable Reject button when disabled prop is true', () => {
    render(<ContentPreviewCard item={mockPhotoItem} disabled={true} />);

    const rejectButton = screen.getByRole('button', { name: /Reject/i });
    expect(rejectButton).toBeDisabled();
  });

  it('should disable Edit button when disabled prop is true', () => {
    render(<ContentPreviewCard item={mockPhotoItem} disabled={true} />);

    const editButton = screen.getByRole('button', { name: /Edit caption/i });
    expect(editButton).toBeDisabled();
  });

  it('should not disable buttons when disabled is false', () => {
    render(<ContentPreviewCard item={mockPhotoItem} disabled={false} />);

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    expect(approveButton).not.toBeDisabled();
  });
});

// ============================================
// IMAGE ERROR HANDLING
// ============================================

describe('ContentPreviewCard - Image Error Handling', () => {
  it('should render image with src', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const img = document.querySelector('img') as HTMLImageElement;

    // Verify the image exists and has the expected src
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('preview.jpg');
  });

  it('should have error handler attached (no crash on error event)', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);
    const img = document.querySelector('img') as HTMLImageElement;

    // Trigger the error handler - should not crash the component
    fireEvent.error(img);

    // The image element should still be in the document
    expect(img).toBeInTheDocument();
  });
});

// ============================================
// COMPONENT STRUCTURE
// ============================================

describe('ContentPreviewCard - Component Structure', () => {
  it('should have proper card structure with data-testid', () => {
    render(<ContentPreviewCard item={mockPhotoItem} />);

    expect(screen.getByTestId('content-preview-card')).toBeInTheDocument();
    expect(screen.getByTestId('file-name')).toBeInTheDocument();
    expect(screen.getByTestId('caption-display')).toBeInTheDocument();
  });
});
