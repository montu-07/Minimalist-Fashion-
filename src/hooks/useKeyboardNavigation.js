import { useEffect, useRef } from 'react';

/**
 * Custom hook for handling keyboard navigation in lists
 * @param {Object} options - Configuration options
 * @param {number} options.itemCount - Total number of items in the list
 * @param {Function} options.onSelect - Callback when an item is selected (Enter/Space)
 * @param {Function} options.onClose - Callback when the list should be closed (Escape)
 * @param {boolean} options.isEnabled - Whether keyboard navigation is enabled
 * @param {number} options.initialFocus - Initial focused index (-1 for none)
 * @returns {Object} - Ref and focus management functions
 */
const useKeyboardNavigation = ({
  itemCount = 0,
  onSelect,
  onClose,
  isEnabled = true,
  initialFocus = -1,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(initialFocus);
  const listRef = useRef(null);

  // Reset focus when item count changes or navigation is disabled
  useEffect(() => {
    if (itemCount === 0 || !isEnabled) {
      setFocusedIndex(-1);
    }
  }, [itemCount, isEnabled]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isEnabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : 0));
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => (prev <= 0 ? itemCount - 1 : prev - 1));
        break;
      
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < itemCount) {
          e.preventDefault();
          onSelect?.(focusedIndex);
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
      
      case 'Tab':
        // Let the browser handle tab navigation
        break;
      
      default:
        break;
    }
  };

  // Scroll the focused item into view if needed
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [focusedIndex]);

  // Set focus on the list when it becomes visible
  useEffect(() => {
    if (isEnabled && itemCount > 0 && listRef.current) {
      listRef.current.focus({ preventScroll: true });
    }
  }, [isEnabled, itemCount]);

  return {
    listRef,
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps: (index) => ({
      role: 'option',
      'aria-selected': focusedIndex === index,
      tabIndex: -1,
      style: {
        backgroundColor: focusedIndex === index ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
        outline: 'none',
      },
    }),
  };
};

export default useKeyboardNavigation;
