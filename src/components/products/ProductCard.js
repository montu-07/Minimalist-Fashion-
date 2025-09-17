import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Rating,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  AddShoppingCart as AddShoppingCartIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useCart } from 'contexts/CartContext';
import { useWishlist } from 'contexts/WishlistContext';
import { formatCurrency } from 'utils/formatters';

const ProductCard = ({ product, onAddToCart, onAddToWishlist, onQuickView }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const isWishlisted = isInWishlist(product.id);
  const inCart = isInCart(product.id);
  const hasDiscount = product.originalPrice > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart({ ...product, quantity: 1 });
    }
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (onAddToWishlist) {
      onAddToWishlist(product);
    } else {
      toggleWishlist(product);
    }
  };

  const handleQuickView = (e) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      // Navigate to product detail page or open a quick view modal
      navigate(`/products/${product.slug || product.id}`);
    }
  };

  const handleCardClick = () => {
    navigate(`/products/${product.slug || product.id}`);
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        overflow: 'visible',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
          '& .product-actions': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <CardActionArea 
        onClick={handleCardClick}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start',
          flex: 1,
          p: 1,
        }}
      >
        {/* Product Image */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            paddingTop: '100%', // 1:1 aspect ratio
            mb: 1,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: theme.palette.grey[100],
          }}
        >
          <CardMedia
            component="img"
            image={product.image || '/placeholder-product.jpg'}
            alt={product.name}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          />

          {/* Discount Badge */}
          {hasDiscount && (
            <Chip
              label={`${discountPercentage}% OFF`}
              color="error"
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                fontWeight: 'bold',
                boxShadow: 1,
              }}
            />
          )}

          {/* Wishlist Button */}
          <IconButton
            onClick={handleWishlistToggle}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'background.paper',
                color: theme.palette.error.main,
              },
            }}
            size="small"
          >
            {isWishlisted ? (
              <FavoriteIcon color="error" fontSize="small" />
            ) : (
              <FavoriteBorderIcon fontSize="small" />
            )}
          </IconButton>

          {/* Quick Actions */}
          <Box
            className="product-actions"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              p: 1,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              transform: 'translateY(100%)',
              opacity: 0,
              transition: 'all 0.3s ease',
            }}
          >
            <Tooltip title="Quick View">
              <IconButton
                size="small"
                onClick={handleQuickView}
                sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={inCart ? 'Added to Cart' : 'Add to Cart'}>
              <span>
                <IconButton
                  size="small"
                  onClick={handleAddToCart}
                  disabled={inCart}
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    },
                    ...(inCart && {
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                    }),
                  }}
                >
                  <AddShoppingCartIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        {/* Product Info */}
        <CardContent sx={{ width: '100%', p: 1, pt: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{ mb: 0.5, textTransform: 'capitalize' }}
          >
            {product.category}
          </Typography>
          
          <Typography
            variant="subtitle2"
            component="h3"
            sx={{
              fontWeight: 500,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.8em',
            }}
          >
            {product.name}
          </Typography>

          {/* Rating */}
          <Box display="flex" alignItems="center" mb={1}>
            <Rating
              value={product.rating || 0}
              precision={0.5}
              readOnly
              size="small"
              sx={{ color: theme.palette.warning.main, mr: 0.5 }}
            />
            <Typography variant="caption" color="text.secondary">
              ({product.reviewCount || 0})
            </Typography>
          </Box>

          {/* Price */}
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight="bold" color="primary">
              {formatCurrency(product.price)}
            </Typography>
            {hasDiscount && (
              <Typography
                variant="body2"
                color="text.disabled"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(product.originalPrice)}
              </Typography>
            )}
          </Box>

          {/* Stock Status */}
          {product.stockStatus && (
            <Box mt={1}>
              <Chip
                label={product.stockStatus === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                size="small"
                color={product.stockStatus === 'in_stock' ? 'success' : 'default'}
                variant="outlined"
                sx={{ height: 20, fontSize: '0.65rem' }}
              />
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;
