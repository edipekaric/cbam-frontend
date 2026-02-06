import React from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';

export interface ProductInfoStepProps {
  productName: string;
  onProductNameChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categoryNames: string[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  createError: string | null;
  createLoading: boolean;
  calculationLoading: boolean;
  calculationId: number | null;
  onNext: () => void;
}

export function ProductInfoStep({
  productName,
  onProductNameChange,
  category,
  onCategoryChange,
  categoryNames,
  categoriesLoading,
  categoriesError,
  createError,
  createLoading,
  calculationLoading,
  calculationId,
  onNext,
}: ProductInfoStepProps) {
  return (
    <>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Product Information
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Product Name"
            variant="outlined"
            value={productName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onProductNameChange(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth disabled={categoriesLoading} error={!!categoriesError}>
            <InputLabel>Product Category</InputLabel>
            <Select
              value={category}
              label="Product Category"
              onChange={(e: { target: { value: string } }) => onCategoryChange(e.target.value)}
              renderValue={(v: string) => (categoriesLoading ? 'Loading...' : v)}
            >
              {categoriesLoading ? (
                <MenuItem disabled>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    Loading categories...
                  </Box>
                </MenuItem>
              ) : (
                categoryNames.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))
              )}
            </Select>
            {categoriesError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {categoriesError}
              </Typography>
            )}
          </FormControl>
        </Grid>
        <Grid size={12}>
          {createError && (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              {createError}
            </Typography>
          )}
          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={onNext}
              disabled={
                !category ||
                !productName ||
                categoriesLoading ||
                createLoading ||
                calculationId == null ||
                calculationLoading
              }
            >
              {createLoading ? 'Saving...' : calculationLoading ? 'Loading...' : 'Next'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
