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
} from '@mui/material';
import { Add, ArrowBack, ArrowForward } from '@mui/icons-material';

export interface FuelEntry {
  id: number;
  sector: string;
  subsector: string;
  subsubsector: string;
  emissionFactorName: string;
  denominator: string;
  amount: string;
  emissionFactorId: number | null;
  emissionFactorValue: number | null;
}

export interface FuelInputStepProps {
  /** Optional step title (e.g. from question FUEL_STEP_LABEL in DB). */
  title?: string;
  /** Optional label for the "add fuel" button (e.g. "+ ADD ANOTHER FUEL" for secondary step). */
  addButtonLabel?: string;
  fuelEntries: FuelEntry[];
  updateFuelEntry: (index: number, updates: Partial<FuelEntry>) => void;
  resolveEmissionFactorId: (entry: FuelEntry) => Promise<void>;
  addFuelEntry: () => void;
  fuelSectors: string[];
  subsectorsCache: Record<string, string[]>;
  subsubsectorsCache: Record<string, string[]>;
  emissionFactorNamesCache: Record<string, string[]>;
  denominatorsCache: Record<string, string[]>;
  fuelLookupLoading: boolean;
  fuelLookupError: string | null;
  onBack: () => void;
  onNext: () => void;
}

export function FuelInputStep({
  title,
  addButtonLabel = 'Add more fuels',
  fuelEntries,
  updateFuelEntry,
  resolveEmissionFactorId,
  addFuelEntry,
  fuelSectors,
  subsectorsCache,
  subsubsectorsCache,
  emissionFactorNamesCache,
  denominatorsCache,
  fuelLookupLoading,
  fuelLookupError,
  onBack,
  onNext,
}: FuelInputStepProps) {
  return (
    <Grid container spacing={3} sx={{ width: '100%', maxWidth: '100%' }}>
      {title && (
        <Grid size={12}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Grid>
      )}
      {fuelLookupError && (
        <Grid size={12}>
          <Typography color="error" sx={{ mb: 2 }}>
            {fuelLookupError}
          </Typography>
        </Grid>
      )}
      {fuelEntries.map((entry: FuelEntry, index: number) => (
        <Grid
          container
          key={entry.id}
          spacing={2}
          sx={{
            mb: 3,
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            width: '100%',
          }}
        >
          <Grid size={4}>
            <FormControl fullWidth disabled={fuelLookupLoading}>
              <InputLabel>Sector</InputLabel>
              <Select
                value={entry.sector}
                label="Sector"
                onChange={(e: { target: { value: string } }) =>
                  updateFuelEntry(index, {
                    sector: e.target.value,
                    subsector: '',
                    subsubsector: '',
                    emissionFactorName: '',
                    denominator: '',
                    emissionFactorId: null,
                    emissionFactorValue: null,
                  })
                }
              >
                {fuelSectors.map((s: string) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={fuelLookupLoading || !entry.sector}>
              <InputLabel>Subsector</InputLabel>
              <Select
                value={entry.subsector}
                label="Subsector"
                onChange={(e: { target: { value: string } }) =>
                  updateFuelEntry(index, {
                    subsector: e.target.value,
                    subsubsector: '',
                    emissionFactorName: '',
                    denominator: '',
                    emissionFactorId: null,
                    emissionFactorValue: null,
                  })
                }
              >
                {(subsectorsCache[entry.sector] ?? []).map((s: string) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={fuelLookupLoading || !entry.subsector}>
              <InputLabel>Subsubsector</InputLabel>
              <Select
                value={entry.subsubsector}
                label="Subsubsector"
                onChange={(e: { target: { value: string } }) =>
                  updateFuelEntry(index, {
                    subsubsector: e.target.value,
                    emissionFactorName: '',
                    denominator: '',
                    emissionFactorId: null,
                    emissionFactorValue: null,
                  })
                }
              >
                {(
                  subsubsectorsCache[
                    entry.sector && entry.subsector ? `${entry.sector}|${entry.subsector}` : ''
                  ] ?? []
                ).map((s: string) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={fuelLookupLoading || !entry.subsector}>
              <InputLabel>EmissionFactorName</InputLabel>
              <Select
                value={entry.emissionFactorName}
                label="EmissionFactorName"
                onChange={(e: { target: { value: string } }) =>
                  updateFuelEntry(index, {
                    emissionFactorName: e.target.value,
                    denominator: '',
                    emissionFactorId: null,
                    emissionFactorValue: null,
                  })
                }
              >
                {(
                  emissionFactorNamesCache[
                    entry.sector && entry.subsector
                      ? `${entry.sector}|${entry.subsector}|${entry.subsubsector ?? ''}`
                      : ''
                  ] ?? []
                ).map((s: string) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <FormControl fullWidth disabled={fuelLookupLoading || !entry.emissionFactorName}>
              <InputLabel>Denominator</InputLabel>
              <Select
                value={entry.denominator}
                label="Denominator"
                onChange={async (e: { target: { value: string } }) => {
                  const denom = e.target.value;
                  updateFuelEntry(index, { denominator: denom });
                  const nextEntry = { ...entry, denominator: denom };
                  await resolveEmissionFactorId(nextEntry);
                }}
              >
                {(
                  denominatorsCache[
                    entry.sector && entry.subsector && entry.emissionFactorName
                      ? `${entry.sector}|${entry.subsector}|${entry.subsubsector ?? ''}|${entry.emissionFactorName}`
                      : ''
                  ] ?? []
                ).map((s: string) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={4}>
            <TextField
              fullWidth
              label="Amount (Količina)"
              value={entry.amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateFuelEntry(index, { amount: e.target.value })
              }
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            />
          </Grid>
        </Grid>
      ))}
      <Grid size={12}>
        <Button
          type="button"
          variant="outlined"
          size="medium"
          startIcon={<Add />}
          onClick={addFuelEntry}
          sx={{ mb: 2 }}
        >
          {addButtonLabel}
        </Button>
      </Grid>
      <Grid size={12}>
        <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
          <Button type="button" variant="outlined" size="large" startIcon={<ArrowBack />} onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={onNext}
            disabled={fuelLookupLoading}
          >
            Next
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
}
