import React from 'react';
import { Paper, Typography, Button, List, ListItem, ListItemText, Chip, Box, Grid } from '@mui/material';
import { AutoFixHigh } from '@mui/icons-material';

const PreprocessingTab: React.FC<{ datasetId?: string }> = ({ datasetId }) => {
    console.log('Preprocessing', datasetId);
    const recipes = [
        { id: 1, name: 'Impute Missing Age', description: 'Fill missing Age values with Median (35)', impact: 'Modifies 240 rows' },
        { id: 2, name: 'One-Hot Encode Country', description: 'Convert Country column to binary columns', impact: 'Adds 5 columns' },
        { id: 3, name: 'Remove Outliers (Salary)', description: 'Cap values above 99th percentile', impact: 'Modifies 15 rows' },
    ];

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
                <Typography variant="h6">Recommended Recipes</Typography>
                <Typography variant="body2">AI-generated suggestions based on your data quality analysis.</Typography>
            </Paper>

            <Grid container spacing={3}>
            </Grid>
            {/* Using List for now */}
            <List>
                {recipes.map((recipe) => (
                    <Paper key={recipe.id} sx={{ mb: 2 }}>
                        <ListItem
                            secondaryAction={
                                <Button variant="contained" startIcon={<AutoFixHigh />}>
                                    Apply
                                </Button>
                            }
                        >
                            <ListItemText
                                primary={<Typography variant="h6">{recipe.name}</Typography>}
                                secondary={
                                    <React.Fragment>
                                        <Typography component="span" variant="body2" color="text.primary">
                                            {recipe.description}
                                        </Typography>
                                        <br />
                                        <Chip label={recipe.impact} size="small" color="info" sx={{ mt: 1 }} />
                                    </React.Fragment>
                                }
                            />
                        </ListItem>
                    </Paper>
                ))}
            </List>
        </Box>
    );
};

export default PreprocessingTab;
