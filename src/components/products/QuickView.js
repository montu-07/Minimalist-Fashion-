import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Button,
  Divider,
  Rating,
  Chip,
  useMediaQuery,
  useTheme,
  Slide,
  Paper,
  Stack,
  Skeleton,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  AddShoppingCart as AddToCartIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
  ArrowBackIos as PrevIcon,
  ArrowForwardIos as NextIcon,
} from '@mui/icons-material';
import { useCart } from 'state/CartContext';
import { useWishlist } from 'state/WishlistContext';
import { useNotifications } from 'contexts/NotificationContext';
import { formatCurrency } from 'core/utils/format';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const ImageGallery = ({ images, productName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const intervalRef = useRef(null);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Auto-advance slides on desktop
  useEffect(() => {
    if (!isMobile && isHovered && images.length > 1) {
      intervalRef.current = setInterval(goToNext, 5000);
      return () => clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isHovered, isMobile, images.length]);

  if (!images || images.length === 0) {
    return (
      <Box
        sx={{
          height: { xs: 300, sm: 400, md: 500 },
          width: '100%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">No image available</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 300, sm: 400, md: 500 },
        width: '100%',
        overflow: 'hidden',
        borderRadius: 1,
        bgcolor: 'background.paper',
      }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Main Image */}
      <Box
        component="img"
        src={images[currentIndex]}
        alt={`${productName} - ${currentIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          transition: 'opacity 0.5s ease-in-out',
          cursor: 'zoom-in',
        }}
      />

      {/* Navigation Arrows */}
      {images.length > 1 && (isMobile || isHovered) && (
        <>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
              zIndex: 2,
            }}
          >
            <PrevIcon />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
              zIndex: 2,
            }}
          >
            <NextIcon />
          </IconButton>
        </>
      )}

      {/* Thumbnail Indicators */}
      {images.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2,
          }}
        >
          {images.map((_, index) => (
            <Box
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentIndex ? 'primary.main' : 'grey.400',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'primary.main',
                  transform: 'scale(1.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

const ProductInfo = ({ product, quantity, onQuantityChange, onAddToCart, onAddToWishlist, isInWishlist, isLoading }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="80%" height={40} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={48} sx={{ borderRadius: 1 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Title and Price */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Rating value={product.rating || 0} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            ({product.reviewCount || 0} reviews)
          </Typography>
        </Box>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', my: 1 }}>
          {formatCurrency(product.price)}
          {product.originalPrice && product.originalPrice > product.price && (
            <Typography
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: 'line-through', ml: 1 }}
            >
              {formatCurrency(product.originalPrice)}
            </Typography>
          )}
          {product.discount && (
            <Chip
              label={`${product.discount}% OFF`}
              color="error"
              size="small"
              sx={{ ml: 1, fontWeight: 'bold' }}
            />
          )}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {product.variants[0].name}:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {product.variants[0].options.map((option, idx) => (
              <Chip
                key={idx}
                label={option}
                variant={idx === 0 ? 'filled' : 'outlined'}
                color="primary"
                onClick={() => {}}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Quantity Selector */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Quantity:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: 120 }}>
          <IconButton
            size="small"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body1" sx={{ px: 2, minWidth: 40, textAlign: 'center' }}>
            {quantity}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onQuantityChange(quantity + 1)}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Action Buttons */}
      <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<AddToCartIcon />}
          onClick={onAddToCart}
          sx={{ py: 1.5, textTransform: 'none' }}
        >
          Add to Cart
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          startIcon={isInWishlist ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          onClick={onAddToWishlist}
          sx={{
            py: 1.5,
            textTransform: 'none',
            borderColor: isInWishlist ? 'error.main' : 'divider',
            color: isInWishlist ? 'error.main' : 'inherit',
            '&:hover': {
              borderColor: isInWishlist ? 'error.dark' : 'text.primary',
            },
          }}
        >
          {isInWishlist ? 'In Wishlist' : 'Wishlist'}
        </Button>
      </Stack>

      {/* Product Details */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Description:
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {product.description || 'No description available.'}
        </Typography>
      </Box>

      {/* Shipping Info */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box component="span" sx={{ color: 'success.main' }}>✓</Box>
          Free shipping on orders over $50
        </Typography>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="span" sx={{ color: 'success.main' }}>✓</Box>
          Free returns within 30 days
        </Typography>
      </Box>
    </Box>
  );
};

const QuickView = ({ product, open, onClose, onAddToCart, onAddToWishlist, isInWishlist }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [product]);

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      await onAddToCart(product, quantity);
      showSuccess(`${product.name} added to cart`);
      // Don't close on mobile to allow adding multiple quantities
      if (!isMobile) {
        onClose();
      }
    } catch (error) {
      showError(error.message || 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      setIsLoading(true);
      await onAddToWishlist(product);
      showSuccess(
        isInWishlist 
          ? 'Removed from wishlist' 
          : 'Added to wishlist'
      );
    } catch (error) {
      showError(error.message || 'Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={isMobile ? Transition : undefined}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          maxWidth: isMobile ? '100%' : '900px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          position: 'relative',
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'text.secondary',
            zIndex: 10,
            bgcolor: 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Product Images */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 1, md: 3 } }}>
            <ImageGallery 
              images={product.images || []} 
              productName={product.name} 
            />
          </Box>

          {/* Product Info */}
          <Box sx={{ width: { xs: '100%', md: '50%' }, p: { xs: 2, md: 3 } }}>
            <ProductInfo
              product={product}
              quantity={quantity}
              onQuantityChange={setQuantity}
              onAddToCart={handleAddToCart}
              onAddToWishlist={handleAddToWishlist}
              isInWishlist={isInWishlist}
              isLoading={isLoading}
            />
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default QuickView;
