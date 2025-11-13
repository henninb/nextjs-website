// pages/furnace.tsx
import { NextPage } from "next";
import Head from "next/head";
import {
  Container,
  Typography,
  Box,
  Paper,
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
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
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
                        <strong>BTU Output</strong>
                      </TableCell>
                      <TableCell>~83,700 BTU/hr (90,000 × 93%)</TableCell>
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
            </Box>
            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
                        <strong>Blower Airflow</strong>
                      </TableCell>
                      <TableCell>~1600 CFM</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>A/C Compatibility</strong>
                      </TableCell>
                      <TableCell>3–4 Ton Systems</TableCell>
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
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Understanding Your Model Number: G1D93AU090D16C-1A
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Code</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Meaning</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <strong>G1D93</strong>
                    </TableCell>
                    <TableCell>
                      93% AFUE, condensing gas furnace
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>A</strong>
                    </TableCell>
                    <TableCell>Upflow / Horizontal configuration</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>U</strong>
                    </TableCell>
                    <TableCell>Natural gas (not propane)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>090</strong>
                    </TableCell>
                    <TableCell>Nominal input = 90,000 BTU/hr</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>D16</strong>
                    </TableCell>
                    <TableCell>
                      Blower size and airflow capacity (~1600 CFM)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>C</strong>
                    </TableCell>
                    <TableCell>Revision code</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>-1A</strong>
                    </TableCell>
                    <TableCell>Variant identifier</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Typography sx={{ mt: 2 }}>
              <strong>HVAC Trade Nomenclature:</strong> HVAC professionals often
              refer to furnaces by their airflow capacity class. Your furnace is
              a <strong>"2K furnace"</strong> (≈2000 CFM class), which refers to
              equipment in the 80,000–100,000 BTU/hr range. This is{" "}
              <strong>not</strong> a "4K furnace" (≈4000 CFM class for
              150,000–200,000 BTU/hr systems). The "2K" designation indicates
              it's properly sized for typical 3–4 ton A/C systems in residential
              applications.
            </Typography>
          </Alert>
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

        {/* Advanced Troubleshooting */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Advanced Troubleshooting Scenarios
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Furnace Short Cycling (Starts and Stops Frequently)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Symptoms:</strong> Furnace runs for 1-5 minutes, shuts
                off, then restarts repeatedly.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Common Causes & Solutions:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Dirty Filter:</strong> Replace air filter immediately -
                  restricted airflow triggers high limit switch
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Dirty Flame Sensor:</strong> Clean with fine sandpaper
                  (220-grit) or emery cloth
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Oversized Furnace:</strong> If your 90K BTU furnace is
                  heating a small space, it may be too powerful and reaching
                  temperature too quickly (thermostat setting issue)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Closed/Blocked Supply Registers:</strong> Ensure at
                  least 80% of supply vents are open
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Failed Limit Switch:</strong> May need replacement if
                  cycling occurs even with clean filter
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Condensate Drain Issues (Water Backup)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Symptoms:</strong> Water pooling around furnace, gurgling
                sounds, 3-flash error code.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Step-by-Step Fix:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  Turn off furnace power at disconnect switch
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Locate condensate trap (usually clear plastic below secondary
                  heat exchanger)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Remove trap and disassemble - clean with hot water and white
                  vinegar (50/50 mix)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Use wet/dry vacuum to clear drain line - suction from floor
                  drain end
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Check PVC vent pipes for proper downward slope (1/4" per foot)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Reassemble trap ensuring proper seal - add water to prime the
                  trap
                </Box>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Prevention:</strong> Pour 1 cup of white vinegar through
                the condensate drain monthly during heating season to prevent
                algae/mold buildup.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Weak or Uneven Heat Distribution
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Symptoms:</strong> Some rooms too cold, others too hot;
                furnace runs constantly but house doesn't reach temperature.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Diagnostic Steps:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check Supply Register Airflow:</strong> Hold tissue
                  paper near each vent - should blow out strongly. Weak airflow
                  indicates duct issues.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Verify Blower Speed Setting:</strong> Control board may
                  have incorrect blower speed tap selected (should be
                  "HEAT-HIGH" tap for proper CFM)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Inspect Blower Wheel:</strong> Remove blower assembly -
                  clean accumulated dust from wheel fins (reduces airflow by
                  30-50% when dirty)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check Ductwork:</strong> Inspect for disconnected ducts
                  in attic/crawlspace, crushed flex duct, or blocked return air
                  paths
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Blower Capacitor Test:</strong> Weak capacitor causes
                  slow blower speed - check with multimeter (should read within
                  ±6% of rated µF)
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Noisy Operation (Banging, Squealing, Rumbling)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Noise Type → Likely Cause:</strong>
              </Typography>
              <TableContainer sx={{ mb: 2 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <strong>Metal "Popping" at Startup/Shutdown</strong>
                      </TableCell>
                      <TableCell>
                        Normal thermal expansion of ductwork - can reduce by
                        adding dampers or insulation
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>High-Pitched Squealing (Constant)</strong>
                      </TableCell>
                      <TableCell>
                        Blower motor bearings failing - replace motor soon to
                        avoid sudden failure
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Rumbling During Burner Operation</strong>
                      </TableCell>
                      <TableCell>
                        Delayed ignition due to dirty burners or weak
                        igniter - clean burners and test igniter amperage
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Loud Humming from Inducer Motor</strong>
                      </TableCell>
                      <TableCell>
                        Inducer motor bearing wear or debris in impeller - inspect
                        and replace if necessary
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <strong>Rattling/Vibration</strong>
                      </TableCell>
                      <TableCell>
                        Loose blower wheel set screw, unbalanced wheel, or loose
                        furnace panels
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Furnace Won't Respond to Thermostat
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Systematic Diagnostic Process:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check Thermostat:</strong> Replace batteries, verify
                  it's set to HEAT mode, temperature set 5°F above room temp
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Verify Power:</strong> Check furnace disconnect switch
                  (often looks like light switch near furnace) - must be ON
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check Circuit Breaker:</strong> Furnace typically uses
                  15-20A breaker - reset if tripped
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Inspect Door Safety Switch:</strong> Blower
                  compartment door must be fully closed to engage safety switch
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Test Thermostat Wiring:</strong> At furnace control
                  board, jumper R to W terminals with short wire - if furnace
                  starts, thermostat or wiring is faulty
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Check 3A or 5A Fuse on Control Board:</strong> Small
                  automotive-style fuse protects low-voltage circuit - replace if
                  blown
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* DIY Maintenance Procedures */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Detailed DIY Maintenance Procedures
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Safety Warning:</strong> Always turn off power at the
            disconnect switch AND circuit breaker before performing maintenance.
            Never work on gas components - call a professional for gas-related
            repairs.
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                How to Clean the Flame Sensor (15 minutes)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Tools Needed:</strong> Phillips screwdriver, 1/4" nut
                driver or wrench, 220-grit sandpaper or emery cloth
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Step-by-Step:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  Turn off power and gas supply to furnace
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Remove burner access panel (usually front lower panel)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Locate flame sensor - thin metal rod (about 1/4" diameter, 3-4"
                  long) positioned in front of burner flames
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Remove mounting screw/nut - sensor usually has one wire
                  connected
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Gently clean the metal rod portion with fine sandpaper - remove
                  all white/gray oxidation until shiny
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  DO NOT use water or chemicals - dry cleaning only
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Reinstall sensor ensuring rod is positioned in flame path (not
                  touching burner)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Restore power and gas, test operation
                </Box>
              </Box>
              <Alert severity="success" sx={{ mt: 2 }}>
                This simple 15-minute maintenance task fixes 1-flash and 8-flash
                errors 90% of the time and can save a $150-250 service call.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Blower Wheel Cleaning (45 minutes)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Why It Matters:</strong> A dirty blower wheel reduces
                airflow by 30-50%, causing short cycling, high limit trips, and
                increased heating costs.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Tools Needed:</strong> Screwdrivers, vacuum, soft brush,
                towels, spray bottle with mild soap solution
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Procedure:</strong>
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  Turn off all power to furnace (disconnect + breaker)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Remove blower compartment door and lower access panel
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Disconnect blower motor wiring (take photo first for reference)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Remove blower assembly - typically slides out on rails after
                  removing 2-4 screws
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Vacuum loose debris from wheel fins using brush attachment
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  For heavy buildup: spray mild soap solution, let soak 5
                  minutes, scrub fins with soft brush
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Rinse with damp cloth (don't spray water on motor bearings)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Dry completely - use towels and let air dry 30 minutes
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Reinstall blower assembly, reconnect wiring, test operation
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Pro Tip:</strong> Clean blower wheel every 2-3 years, or
                annually if you have pets or live in a dusty area.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Annual Pre-Season Startup Checklist
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Perform these checks in late September/early October
                before heating season:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  Replace air filter with new high-quality MERV 11 filter
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Clean flame sensor until shiny
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Vacuum blower compartment and visible dust
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Clean condensate trap and flush drain line with vinegar/water
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Inspect PVC vent pipes - clear debris from outdoor terminations
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Test thermostat by setting 5°F above room temp - verify startup
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Listen for unusual noises during first few cycles
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Check all supply registers - ensure 80%+ are open
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Test carbon monoxide detectors (should be on each floor)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  Verify furnace area is clear of storage/combustibles (3-foot
                  clearance)
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Paper>

        {/* Performance Optimization */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Performance Optimization & Efficiency Tips
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" paragraph>
            Your 93% AFUE furnace is already highly efficient, but these tips can
            maximize performance and minimize operating costs:
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Optimizing Combustion Efficiency
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Proper Gas Pressure:</strong> Should be 3.5" WC inlet,
                  manifold adjusted per rating plate (typically 3.0-3.5" WC).
                  Have technician verify annually.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Clean Burners:</strong> Carbon buildup reduces flame
                  quality. Professional cleaning every 3-5 years maintains peak
                  efficiency.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Flame Appearance Check:</strong> Flames should be blue
                  with slight orange tips. Yellow/lazy flames indicate incomplete
                  combustion - call technician.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Condensate pH Testing:</strong> Condensate should be
                  mildly acidic (pH 3-5). Extremely acidic indicates combustion
                  issues.
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Airflow Optimization</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Target Airflow:</strong> Your furnace should deliver
                  ~1600 CFM at high heat speed. Under-airflow causes overheating;
                  over-airflow reduces efficiency.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Temperature Rise Check:</strong> Measure supply minus
                  return air temp - should be 40-70°F. Outside this range
                  indicates airflow problems.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Duct Sealing:</strong> Seal all duct joints with mastic
                  (not duct tape). Leaky ducts waste 20-30% of heated air.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Return Air Adequacy:</strong> Return air grilles should
                  total at least 2 sq ft per ton (6-8 sq ft for your system).
                  Restricted returns kill efficiency.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Filter Upgrade:</strong> Use MERV 11 pleated filters -
                  balance between filtration and airflow. Change every 60-90 days.
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Thermostat Programming for Efficiency
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Setback Strategy:</strong> Lower temp 8-10°F when away
                  or sleeping saves 10-15% on heating costs
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Optimal Settings:</strong>
                  <br />• Awake/Home: 68-70°F
                  <br />• Sleeping: 62-65°F
                  <br />• Away 8+ hours: 60-62°F
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Fan Setting:</strong> Use AUTO mode - continuous fan
                  (ON) increases energy use and dust circulation
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Smart Thermostat Benefits:</strong> Wi-Fi thermostats
                  with learning algorithms can reduce bills 10-23% through
                  optimized scheduling
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Long-Term Efficiency Maintenance
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Maintenance Item</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Frequency</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Efficiency Impact</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Replace air filter</TableCell>
                      <TableCell>Every 2-3 months</TableCell>
                      <TableCell>5-15% savings</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Clean flame sensor</TableCell>
                      <TableCell>Annually</TableCell>
                      <TableCell>Prevents short cycling</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Clean blower wheel</TableCell>
                      <TableCell>Every 2-3 years</TableCell>
                      <TableCell>8-12% airflow improvement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Professional tune-up</TableCell>
                      <TableCell>Annually</TableCell>
                      <TableCell>Maintains 93% efficiency</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Clean burners</TableCell>
                      <TableCell>Every 3-5 years</TableCell>
                      <TableCell>2-4% efficiency gain</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Seal ductwork</TableCell>
                      <TableCell>One-time/as needed</TableCell>
                      <TableCell>20-30% loss prevention</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Alert severity="success" sx={{ mt: 2 }}>
            <strong>Efficiency Tracking:</strong> Monitor your gas bills
            year-over-year (adjusted for weather). A properly maintained 93% AFUE
            furnace should use 15-20% less gas than older 80% furnaces. Sudden
            increases indicate maintenance needs or system problems.
          </Alert>
        </Paper>

        {/* Sizing and Installation Considerations */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Sizing, Installation & Compatibility Notes
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            This section helps you understand if your furnace is properly sized
            for your home and compatible with your HVAC system.
          </Alert>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Is Your 90K BTU Furnace Properly Sized?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>General Sizing Guidelines:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Climate Zone:</strong> Your 90,000 BTU input (~83,700
                  BTU output) furnace typically heats:
                  <br />• Cold Climate (USDA Zone 5-6): 1,800-2,200 sq ft
                  <br />• Moderate Climate (Zone 6-7): 2,200-2,800 sq ft
                  <br />• Assumptions: Standard insulation, 8-9 ft ceilings, newer
                  construction
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Manual J Calculation:</strong> Professional load
                  calculation considers insulation, windows, orientation, climate.
                  Ask installer for copy.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Signs of Oversizing:</strong> Short cycling (runs <10
                  minutes), temperature swings, some rooms too hot while others
                  cold
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Signs of Undersizing:</strong> Runs continuously on
                  coldest days but can't reach setpoint, high gas bills
                </Box>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Oversizing Problem:</strong> Many contractors oversize
                furnaces by 40-50%. An oversized furnace short cycles, wastes
                energy, and wears out faster. If your furnace runs less than 10
                minutes per cycle, it may be oversized.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">A/C System Compatibility</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Your Furnace Blower Specifications:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Blower Capacity:</strong> ~1600 CFM maximum
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Compatible A/C Sizes:</strong> 2.5 to 4 tons (30,000 to
                  48,000 BTU cooling)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Ideal Pairing:</strong> 3-ton (36,000 BTU) A/C system
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Airflow Requirements:</strong> A/C needs 400 CFM per
                  ton:
                  <br />• 2.5 ton = 1000 CFM
                  <br />• 3 ton = 1200 CFM
                  <br />• 3.5 ton = 1400 CFM
                  <br />• 4 ton = 1600 CFM (maximum for this blower)
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                If you're adding or replacing A/C, ensure the outdoor unit and
                indoor coil match your furnace's blower capacity. A 5-ton A/C on
                this furnace would be undersized airflow-wise.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Venting Requirements (Condensing Furnace)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Your 93% AFUE furnace uses PVC venting:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Intake Air:</strong> 2" PVC pipe from outdoors (or
                  basement/crawlspace if sufficient combustion air)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Exhaust Vent:</strong> 2" or 3" PVC pipe (check
                  installation manual for required size based on run length)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Maximum Vent Length:</strong> Typically 40-60 ft
                  equivalent length (each elbow = 5 ft equivalent)
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Slope Requirements:</strong> Vent pipes must slope 1/4"
                  per foot back to furnace to drain condensate
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Outdoor Termination:</strong> Must be at least 4 ft
                  below, 4 ft horizontally from, or 1 ft above windows/doors
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>PVC Type:</strong> Schedule 40 PVC, cellular core, or
                  CPVC rated for condensing furnace exhaust
                </Box>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <strong>Common Venting Problems:</strong> Sagging horizontal runs
                create water traps (3-flash error). Blocked outdoor terminations
                from snow, leaves, or bird nests cause pressure switch errors.
                Inspect vents seasonally.
              </Alert>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                Electrical Requirements & Wiring
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>Power Requirements:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Voltage:</strong> 120V AC, 60 Hz, single phase
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Circuit:</strong> Dedicated 15A or 20A circuit required
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Amperage Draw:</strong>
                  <br />• Inducer motor: 1.8-2.5A
                  <br />• Hot surface igniter: 3.0-4.5A (during ignition)
                  <br />• Blower motor: 7-12A (depending on speed)
                  <br />• Total: Typically 10-14A during operation
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Thermostat Wiring:</strong> 24V AC control circuit
                  (typically 18-8 or 18-5 thermostat wire)
                </Box>
              </Box>
              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Typical Thermostat Wire Terminals:</strong>
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <strong>Terminal</strong>
                      </TableCell>
                      <TableCell>
                        <strong>Function</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>R (or Rh)</TableCell>
                      <TableCell>24V power from transformer</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>C</TableCell>
                      <TableCell>Common (return path for 24V)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>W (or W1)</TableCell>
                      <TableCell>Heat call</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>G</TableCell>
                      <TableCell>Fan</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Y (or Y1)</TableCell>
                      <TableCell>Cooling call (A/C)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Replacement Upgrade Options</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                <strong>When your furnace eventually needs replacement, consider
                these upgrades:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Variable-Speed Blower:</strong> Current furnace has PSC
                  (permanent split capacitor) motor. Variable-speed ECM motors use
                  30-50% less electricity, provide better humidity control, and
                  quieter operation.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Two-Stage or Modulating Burner:</strong> Your
                  single-stage burner runs full-blast or off. Two-stage (low/high)
                  or modulating (10-100%) burners improve comfort and efficiency.
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>96-98% AFUE:</strong> Next tier of condensing furnaces
                  saves additional 3-5% on gas bills
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Heat Pump Hybrid:</strong> In moderate climates, heat
                  pump with gas furnace backup can reduce heating costs 30-60%
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Smart Controls:</strong> Communicating furnace +
                  thermostat optimizes staging, airflow, and humidity for maximum
                  comfort/efficiency
                </Box>
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                <strong>Furnace Lifespan:</strong> Well-maintained condensing
                furnaces typically last 15-20 years. Plan for replacement when:
                repair costs exceed 50% of new furnace cost, multiple major
                component failures, or efficiency drops significantly (indicated by
                rising gas bills).
              </Alert>
            </AccordionDetails>
          </Accordion>
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

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>
          </Box>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <strong>Important:</strong> When ordering parts, have your complete
            model and serial number ready. Some parts vary by manufacturing date
            and specific furnace configuration.
          </Alert>
        </Paper>

        {/* Critical Spare Parts */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            🧰 Critical Spare Parts (Most Likely to Fail)
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 2 }}>
            These are the components most likely to fail during your furnace's
            lifetime, ordered by replacement frequency. Consider keeping critical
            items on hand for emergency repairs.
          </Alert>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Component</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Function</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Typical Lifespan</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Common Replacement / Equivalent</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Notes</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Flame Sensor</strong>
                  </TableCell>
                  <TableCell>Confirms burner flame</TableCell>
                  <TableCell>3–5 years</TableCell>
                  <TableCell>
                    Armstrong / Lennox 28K65 or 62-24044-01
                  </TableCell>
                  <TableCell>
                    Clean yearly; inexpensive (~$15–25)
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Hot Surface Igniter (HSI)</strong>
                  </TableCell>
                  <TableCell>Ignites gas</TableCell>
                  <TableCell>5–8 years</TableCell>
                  <TableCell>Norton 271M, White-Rodgers 767A-380</TableCell>
                  <TableCell>
                    Fragile — don't touch the element; ~$30
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Blower Capacitor</strong>
                  </TableCell>
                  <TableCell>Starts blower motor</TableCell>
                  <TableCell>5–10 years</TableCell>
                  <TableCell>
                    Match µF & voltage (often 10 µF 370 V)
                  </TableCell>
                  <TableCell>
                    Read rating printed on side; cheap (~$10)
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Inducer Motor / Draft Fan</strong>
                  </TableCell>
                  <TableCell>Pulls exhaust through heat exchangers</TableCell>
                  <TableCell>10–15 years</TableCell>
                  <TableCell>Fasco A150, Armstrong 60W66</TableCell>
                  <TableCell>Listen for squealing/bearing noise</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Pressure Switch</strong>
                  </TableCell>
                  <TableCell>Verifies inducer airflow</TableCell>
                  <TableCell>10–15 years</TableCell>
                  <TableCell>
                    0.60″ WC or 0.70″ WC switch, e.g., Lennox 11U38
                  </TableCell>
                  <TableCell>Mounting and rating must match exactly</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Control Board</strong>
                  </TableCell>
                  <TableCell>Brain of furnace</TableCell>
                  <TableCell>15–25 years</TableCell>
                  <TableCell>
                    Armstrong / Lennox R47594-001 (or White-Rodgers 50A65-475)
                  </TableCell>
                  <TableCell>
                    Keep a used one as backup if possible
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Blower Motor (PSC)</strong>
                  </TableCell>
                  <TableCell>Circulates air</TableCell>
                  <TableCell>15–25 years</TableCell>
                  <TableCell>
                    1/3 HP 115 V 3-speed (Rheem 51-23012-41, Century DL1076)
                  </TableCell>
                  <TableCell>
                    Replace with matching rotation & shaft
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Limit Switch / Rollout Switch</strong>
                  </TableCell>
                  <TableCell>Safety devices</TableCell>
                  <TableCell>15+ years</TableCell>
                  <TableCell>
                    Various — often L270F or manual-reset rollouts
                  </TableCell>
                  <TableCell>Keep one of each style as spare</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <strong>Condensate Trap & Hose Kit</strong>
                  </TableCell>
                  <TableCell>Drains water</TableCell>
                  <TableCell>N/A (maintenance item)</TableCell>
                  <TableCell>OEM Armstrong trap + tubing</TableCell>
                  <TableCell>
                    Clean yearly; replace if brittle or clogged
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Pro Tip:</strong> The flame sensor, HSI, and blower
              capacitor fail most frequently. Consider keeping these inexpensive
              parts on hand, especially before winter. A $20 part can save you
              from an emergency service call costing $200+.
            </Typography>
          </Alert>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Compatibility Note:</strong> Always verify part numbers with
            your furnace's model and serial number. Some parts vary by
            manufacturing date. When in doubt, take the old part to a supplier
            for visual confirmation.
          </Alert>
        </Paper>

        {/* Videos & Resources */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Educational Videos & Resources
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: "300px" }}>
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
            </Box>
          </Box>
        </Paper>

        {/* Official Resources */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Official Resources & Documentation
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>

            <Box sx={{ flex: "1 1 calc(33.333% - 10px)", minWidth: "250px" }}>
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
            </Box>
          </Box>
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
