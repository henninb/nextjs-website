// pages/furnace.tsx
import { NextPage } from "next";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Chip,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const FurnacePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>
          Armstrong Furnace G1D93AU090D16C-1A | Maintenance & Reference
        </title>
        <meta
          name="description"
          content="Complete reference guide for Armstrong G1D93AU090D16C-1A furnace including specifications, maintenance, troubleshooting, and parts"
        />
      </Head>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Armstrong Furnace Reference
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Model: G1D93AU090D16C-1A
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
            <Chip label="93% AFUE" color="success" />
            <Chip label="90,000 BTU" color="primary" />
            <Chip label="Ultra V Tech Series" />
            <Chip label="Condensing Gas Furnace" />
          </Box>
        </Box>

        {/* Technical Specifications */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Technical Specifications
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Model Number</strong>
                      </TableCell>
                      <TableCell>G1D93AU090D16C-1A</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Manufacturer</strong>
                      </TableCell>
                      <TableCell>Armstrong Air (Allied/Lennox)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Series</strong>
                      </TableCell>
                      <TableCell>Ultra V Tech</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>AFUE Rating</strong>
                      </TableCell>
                      <TableCell>93% (High Efficiency)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>BTU Input</strong>
                      </TableCell>
                      <TableCell>90,000 BTU/hr</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Furnace Type</strong>
                      </TableCell>
                      <TableCell>Condensing Gas Furnace</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Configuration</strong>
                      </TableCell>
                      <TableCell>Upflow/Horizontal</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Heat Exchanger</strong>
                      </TableCell>
                      <TableCell>
                        Aluminized Steel Primary
                        <br />
                        AL 29-4C Stainless Secondary
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Burner Type</strong>
                      </TableCell>
                      <TableCell>Aluminized Steel Inshot Burners</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Blower Motor</strong>
                      </TableCell>
                      <TableCell>Multi-Speed PSC Motor</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>ENERGY STAR</strong>
                      </TableCell>
                      <TableCell>Qualified</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Fuel Type</strong>
                      </TableCell>
                      <TableCell>Natural Gas</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Paper>

        {/* How It Works */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            How Your Furnace Works
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography paragraph>
            Your Armstrong G1D93AU is a <strong>condensing gas furnace</strong>{" "}
            that achieves 93% efficiency by extracting additional heat from
            combustion gases that would otherwise be vented outside.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Operating Sequence:
          </Typography>
          <Box component="ol" sx={{ pl: 2 }}>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Thermostat Call:</strong> When your thermostat calls for
              heat, the electronic control board initiates the heating cycle.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Inducer Motor Start:</strong> The draft inducer motor
              starts, creating negative pressure to safely vent combustion gases
              and pull fresh air for combustion.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Pressure Switch Verification:</strong> The pressure switch
              verifies proper airflow before allowing ignition.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Ignition:</strong> The hot surface igniter glows red-hot,
              then the gas valve opens and ignites the gas at the burners.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Primary Heat Exchange:</strong> Combustion gases heat the
              primary aluminized steel heat exchanger, warming the air passing
              over it.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Secondary Heat Exchange (Condensing):</strong> Hot exhaust
              gases pass through the secondary stainless steel heat exchanger,
              where they cool below the dew point (~140°F), causing water vapor
              to condense. This condensation releases additional heat energy,
              boosting efficiency to 93%.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Blower Activation:</strong> After a warm-up delay, the
              multi-speed PSC blower motor starts, circulating heated air
              through your ductwork.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Condensate Drainage:</strong> Acidic condensate water
              drains through the condensate trap to a floor drain or condensate
              pump.
            </Box>
            <Box component="li" sx={{ mb: 1 }}>
              <strong>Cycle Completion:</strong> When the thermostat is
              satisfied, the gas valve closes. The blower continues running
              briefly to extract remaining heat.
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Why 93% Efficient?</strong> By condensing water vapor from
            exhaust gases, your furnace recovers latent heat that standard
            furnaces (80% AFUE) waste through the vent, converting 93 cents of
            every dollar of gas into usable heat.
          </Alert>
        </Paper>

        {/* Maintenance Schedule */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Maintenance Schedule
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Monthly Tasks</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check/Replace Air Filter:</strong> Inspect monthly,
                  replace when dirty (typically every 1-3 months depending on
                  usage and filter type). Dirty filters are the #1 cause of
                  furnace problems.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Visual Inspection:</strong> Look for any unusual
                  sounds, smells, or leaks around the furnace.
                </Box>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Filter Size:</strong> Check your existing filter for
                printed dimensions. Common sizes are 16x20x1, 16x25x1, or
                20x25x1. Measure the filter slot if unsure.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Seasonal Tasks (Fall/Spring)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Condensate Drain & Trap:</strong> Clean the condensate
                  trap and drain line to prevent clogs. Pour water through the
                  trap to ensure it drains properly.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Flame Sensor Cleaning:</strong> Gently clean the flame
                  sensor rod with fine sandpaper or steel wool to remove carbon
                  buildup.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Blower Compartment:</strong> Vacuum dust and debris
                  from the blower compartment and blower wheel.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Inspect Venting:</strong> Check PVC vent pipes for
                  blockages, proper slope, and secure connections.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Test Thermostat:</strong> Verify accurate temperature
                  reading and proper operation.
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Annual Professional Service</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  Complete system inspection and safety check
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Combustion analysis and efficiency testing
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Heat exchanger inspection for cracks or corrosion
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Burner cleaning and adjustment
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Inducer motor and pressure switch testing
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Blower motor lubrication (if applicable)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Gas pressure and valve testing
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Electrical connection inspection
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Control board diagnostics
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Schedule professional service in late summer/early fall before
                heating season begins.
              </Alert>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Troubleshooting */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Troubleshooting & Error Codes
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Your furnace has an LED indicator light on the control board that
            flashes error codes. Count the number of flashes to identify the
            issue.
          </Alert>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>LED Code</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Meaning</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Common Causes</strong>
                  </TableCell>
                  <TableCell>
                    <strong>DIY Fixes</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Solid ON</TableCell>
                  <TableCell>Normal Operation</TableCell>
                  <TableCell>System running properly</TableCell>
                  <TableCell>None needed</TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>1 Flash</TableCell>
                  <TableCell>Flame signal when gas valve closed</TableCell>
                  <TableCell>
                    Flame sensor contamination, gas valve leak
                  </TableCell>
                  <TableCell>
                    Clean flame sensor; call technician if persists
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>2 Flashes</TableCell>
                  <TableCell>Pressure switch stuck closed</TableCell>
                  <TableCell>Faulty pressure switch, wiring issue</TableCell>
                  <TableCell>
                    Check wiring connections; may need replacement
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>3 Flashes</TableCell>
                  <TableCell>Pressure switch won't close</TableCell>
                  <TableCell>
                    Blocked vent, failed inducer motor, clogged drain
                  </TableCell>
                  <TableCell>
                    Check venting for blockages; clean condensate drain
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#f8d7da" }}>
                  <TableCell>4 Flashes</TableCell>
                  <TableCell>High limit switch open (overheating)</TableCell>
                  <TableCell>
                    Restricted airflow, dirty filter, blocked ducts
                  </TableCell>
                  <TableCell>
                    Replace filter; check all supply registers are open
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#f8d7da" }}>
                  <TableCell>5 Flashes</TableCell>
                  <TableCell>Rollout switch tripped</TableCell>
                  <TableCell>Flame rollout (serious safety issue)</TableCell>
                  <TableCell>
                    <strong>
                      SHUT DOWN FURNACE - Call technician immediately
                    </strong>
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>6 Flashes</TableCell>
                  <TableCell>Pressure switch lockout</TableCell>
                  <TableCell>Multiple pressure switch trips</TableCell>
                  <TableCell>
                    Address cause of 3-flash code; reset by power cycling
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>7 Flashes</TableCell>
                  <TableCell>Ignition failure</TableCell>
                  <TableCell>
                    Failed igniter, gas supply issue, flame sensor
                  </TableCell>
                  <TableCell>
                    Check gas valve is open; clean flame sensor
                  </TableCell>
                </TableRow>
                <TableRow sx={{ bgcolor: "#fff3cd" }}>
                  <TableCell>8 Flashes</TableCell>
                  <TableCell>Flame loss during operation</TableCell>
                  <TableCell>
                    Dirty flame sensor, intermittent gas supply
                  </TableCell>
                  <TableCell>Clean flame sensor; verify gas pressure</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Safety First:</strong> If you smell gas, leave immediately
            and call your gas company. Never ignore a 5-flash error (rollout
            switch) - this indicates dangerous flame spillage.
          </Alert>
        </Paper>

        {/* Parts Catalog */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Common Replacement Parts
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            Armstrong Air is now part of Allied/Lennox. Many parts are
            interchangeable with Lennox and Ducane furnaces. Always verify part
            compatibility before ordering.
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Air Filters
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Common Sizes:</strong> 16x20x1, 16x25x1, 20x25x1
                    (verify your size)
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>MERV Ratings:</strong>
                    <br />• MERV 8: Standard protection
                    <br />• MERV 11: Better allergen filtration
                    <br />• MERV 13: Premium filtration
                  </Typography>
                  <Link
                    href="https://www.amazon.com/s?k=furnace+filter"
                    target="_blank"
                    rel="noopener"
                  >
                    Buy on Amazon →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Draft Inducer Motor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Part Numbers:</strong>
                    <br />• R100676-01 (Inducer Assembly)
                    <br />• R06428D455 (With Pressure Switch)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: No heat, 3-flash error, unusual noises
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.furnacepartsource.com/brands/Armstrong-Furnace.html"
                      target="_blank"
                      rel="noopener"
                    >
                      Furnace Parts Source →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Pressure Switch
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Part Numbers:</strong>
                    <br />• R102614-01 (-0.40" WC)
                    <br />• R102699-01 (-0.60" WC)
                    <br />• R101432-13 (-0.60" WC)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: 2-flash or 3-flash error codes
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.northamericahvac.com/oem-mpl-lennox-armstrong-furnace-air-pressure-switch-9370do-bs-0036/"
                      target="_blank"
                      rel="noopener"
                    >
                      North America HVAC →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hot Surface Igniter
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Universal Part:</strong> Most 80-90% furnaces
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: 7-flash error, no ignition, cracked igniter
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.amazon.com/s?k=hot+surface+igniter"
                      target="_blank"
                      rel="noopener"
                    >
                      Buy on Amazon →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Flame Sensor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Maintenance:</strong> Clean with fine sandpaper
                    every 6 months
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: 1-flash or 8-flash error, furnace shuts off after
                    ignition
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.amazon.com/s?k=furnace+flame+sensor"
                      target="_blank"
                      rel="noopener"
                    >
                      Buy on Amazon →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Blower Motor
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> Multi-Speed PSC Motor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: No airflow, weak airflow, loud bearing noise
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://shortyshvac.com/index.php?main_page=index&cPath=535_155"
                      target="_blank"
                      rel="noopener"
                    >
                      Shortys HVAC →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Control Board
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Part Number:</strong> R40403-003 (Blower Control)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: No operation, erratic LED codes, blower issues
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.climatedoctors.com/products/armstrong-r40403-003-board-furnace-blower-control-circuit-board.html"
                      target="_blank"
                      rel="noopener"
                    >
                      Climate Doctors →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gas Valve
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Type:</strong> Two-Stage Natural Gas Valve
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Symptoms: No gas flow, 7-flash error, clicking but no
                    ignition
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Link
                      href="https://www.furnacepartsource.com/brands/Armstrong-Furnace.html"
                      target="_blank"
                      rel="noopener"
                    >
                      Furnace Parts Source →
                    </Link>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <strong>Important:</strong> When ordering parts, have your complete
            model and serial number ready. Some parts vary by manufacturing date
            and specific furnace configuration.
          </Alert>
        </Paper>

        {/* Videos & Resources */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Educational Videos & Resources
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    How Condensing Furnaces Work
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Understand the science behind 93% efficiency and condensing
                    technology
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=condensing+furnace+how+it+works"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Furnace Flame Sensor Cleaning
                  </Typography>
                  <Typography variant="body2" paragraph>
                    DIY cleaning tutorial for fixing 1-flash and 8-flash errors
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=furnace+flame+sensor+cleaning"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Furnace Filter Replacement
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Step-by-step guide for changing your furnace filter
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=furnace+filter+replacement"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Troubleshooting Pressure Switch Issues
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Diagnose and fix 2-flash and 3-flash error codes
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=furnace+pressure+switch+troubleshooting"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Condensate Drain Cleaning
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Prevent clogs and 3-flash errors with regular drain
                    maintenance
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=condensing+furnace+drain+cleaning"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Understanding Furnace Error Codes
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Complete guide to LED flash codes and diagnostics
                  </Typography>
                  <Link
                    href="https://www.youtube.com/results?search_query=armstrong+lennox+furnace+error+codes"
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube →
                  </Link>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Official Resources */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Official Resources & Documentation
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://www.armstrongair.com/owners/literature/"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Product Literature
                    </Typography>
                    <Typography variant="body2">
                      Official Armstrong Air manuals and documentation
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://www.armstrongair.com/owners/troubleshooting/"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Troubleshooting Guide
                    </Typography>
                    <Typography variant="body2">
                      Official troubleshooting resources from Armstrong Air
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://www.armstrongair.com/owners/maintenance-and-service/"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Maintenance & Service
                    </Typography>
                    <Typography variant="body2">
                      Official maintenance recommendations and service info
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://inspectapedia.com/heat/Armstrong-Heater-Age-Manuals-Contact.php"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      InspectAPedia
                    </Typography>
                    <Typography variant="body2">
                      Third-party manuals and technical information
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://www.furnacepartsource.com/brands/Armstrong-Furnace.html"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Parts Catalog
                    </Typography>
                    <Typography variant="body2">
                      Browse comprehensive Armstrong furnace parts
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Link
                href="https://www.energystar.gov/"
                target="_blank"
                rel="noopener"
                sx={{ textDecoration: "none" }}
              >
                <Card sx={{ height: "100%", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ENERGY STAR
                    </Typography>
                    <Typography variant="body2">
                      Energy efficiency information and rebates
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          </Grid>
        </Paper>

        {/* Safety & Warranty */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Safety & Important Information
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Emergency Situations
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>
                <strong>Gas Smell:</strong> Leave immediately and call your gas
                company from outside
              </li>
              <li>
                <strong>Carbon Monoxide Detector Alarm:</strong> Evacuate and
                call 911
              </li>
              <li>
                <strong>Rollout Switch (5-flash):</strong> Shut down furnace and
                call HVAC technician
              </li>
            </Box>
          </Alert>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Professional Service Required For:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 0 }}>
              <li>Gas valve repairs or replacement</li>
              <li>Heat exchanger inspection or replacement</li>
              <li>Combustion analysis and adjustment</li>
              <li>Electrical control board replacement</li>
              <li>Any work involving gas lines or combustion components</li>
            </Box>
          </Alert>

          <Alert severity="info">
            <Typography variant="h6" gutterBottom>
              Warranty Information
            </Typography>
            <Typography paragraph>
              Armstrong Air furnaces typically come with:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mb: 1 }}>
              <li>10-year limited parts warranty (when registered)</li>
              <li>20-year limited heat exchanger warranty (when registered)</li>
              <li>1-year labor warranty (through installing contractor)</li>
            </Box>
            <Typography>
              Register your furnace at{" "}
              <Link
                href="https://www.armstrongair.com/"
                target="_blank"
                rel="noopener"
              >
                armstrongair.com
              </Link>{" "}
              to activate full warranty coverage.
            </Typography>
          </Alert>
        </Paper>
      </Container>
    </>
  );
};

export default FurnacePage;
