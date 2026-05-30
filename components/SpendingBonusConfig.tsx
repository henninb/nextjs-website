"use client";
import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteRounded";
import EditIcon from "@mui/icons-material/Edit";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import useAccountFetch from "../hooks/useAccountFetch";
import useParameterDelete from "../hooks/useParameterDelete";
import useParameterFetch from "../hooks/useParameterFetch";
import useParameterInsert from "../hooks/useParameterInsert";
import useParameterUpdate from "../hooks/useParameterUpdate";
import Parameter from "../model/Parameter";
import { useAuth } from "./AuthProvider";
import ConfirmDialog from "./ConfirmDialog";
import FormDialog from "./FormDialog";
import { currencyFormat } from "./Common";

interface BonusConfig {
  accountNameOwner: string;
  startDate: string;
  targetAmount: number;
  rewardAmount: number;
  windowDays: number;
  params: {
    startDate?: Parameter;
    target?: Parameter;
    reward?: Parameter;
    windowDays?: Parameter;
  };
}

interface BonusFormData {
  accountNameOwner: string;
  startDate: string;
  targetAmount: string;
  rewardAmount: string;
  windowDays: string;
}

const BONUS_PREFIXES = [
  "bonus_start_date_",
  "bonus_target_",
  "bonus_reward_",
  "bonus_window_days_",
] as const;

export function isBonusParam(name: string): boolean {
  return BONUS_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function deriveBonusConfigs(parameters: Parameter[]): BonusConfig[] {
  const map: Record<string, BonusConfig> = {};

  for (const param of parameters) {
    let account: string | null = null;
    let field: keyof BonusConfig["params"] | null = null;

    if (param.parameterName.startsWith("bonus_start_date_")) {
      account = param.parameterName.slice("bonus_start_date_".length);
      field = "startDate";
    } else if (param.parameterName.startsWith("bonus_target_")) {
      account = param.parameterName.slice("bonus_target_".length);
      field = "target";
    } else if (param.parameterName.startsWith("bonus_reward_")) {
      account = param.parameterName.slice("bonus_reward_".length);
      field = "reward";
    } else if (param.parameterName.startsWith("bonus_window_days_")) {
      account = param.parameterName.slice("bonus_window_days_".length);
      field = "windowDays";
    }

    if (!account || !field) continue;

    if (!map[account]) {
      map[account] = {
        accountNameOwner: account,
        startDate: "",
        targetAmount: 0,
        rewardAmount: 0,
        windowDays: 90,
        params: {},
      };
    }

    map[account].params[field] = param;
    if (field === "startDate") map[account].startDate = param.parameterValue;
    else if (field === "target")
      map[account].targetAmount = parseFloat(param.parameterValue) || 0;
    else if (field === "reward")
      map[account].rewardAmount = parseFloat(param.parameterValue) || 0;
    else if (field === "windowDays")
      map[account].windowDays = parseInt(param.parameterValue) || 90;
  }

  return Object.values(map).sort((a, b) =>
    a.accountNameOwner.localeCompare(b.accountNameOwner),
  );
}

const emptyForm: BonusFormData = {
  accountNameOwner: "",
  startDate: new Date().toISOString().split("T")[0],
  targetAmount: "",
  rewardAmount: "",
  windowDays: "",
};

interface Props {
  onError: (error: unknown, module: string, throwIt: boolean) => void;
  onSuccess: (message: string) => void;
}

export default function SpendingBonusConfig({ onError, onSuccess }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BonusConfig | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState<BonusConfig | null>(null);
  const [formData, setFormData] = useState<BonusFormData>(emptyForm);

  const { user } = useAuth();
  const { data: parameters } = useParameterFetch();
  const { data: accounts } = useAccountFetch();
  const { mutateAsync: insertParameter } = useParameterInsert();
  const { mutateAsync: updateParameter } = useParameterUpdate();
  const { mutateAsync: deleteParameter } = useParameterDelete();

  const bonusConfigs = useMemo(
    () => deriveBonusConfigs(parameters || []),
    [parameters],
  );

  const handleOpenAdd = () => {
    setFormData(emptyForm);
    setEditingConfig(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (config: BonusConfig) => {
    setFormData({
      accountNameOwner: config.accountNameOwner,
      startDate: config.startDate,
      targetAmount: String(config.targetAmount),
      rewardAmount: String(config.rewardAmount),
      windowDays: String(config.windowDays),
    });
    setEditingConfig(config);
    setShowDialog(true);
  };

  const makeParam = (
    name: string,
    value: string,
    existingId?: number,
  ): Parameter => ({
    parameterId: existingId ?? 0,
    parameterName: name,
    parameterValue: value,
    activeStatus: true,
    owner: user?.username,
  });

  const handleSave = async () => {
    const account = formData.accountNameOwner.trim();
    if (!account || !formData.startDate || !formData.targetAmount || !formData.rewardAmount) {
      onError(new Error("All fields are required"), "Bonus Config", false);
      return;
    }

    const defs: Array<{
      name: string;
      value: string;
      field: keyof BonusConfig["params"];
    }> = [
      { name: `bonus_start_date_${account}`, value: formData.startDate, field: "startDate" },
      { name: `bonus_target_${account}`, value: formData.targetAmount, field: "target" },
      { name: `bonus_reward_${account}`, value: formData.rewardAmount, field: "reward" },
      { name: `bonus_window_days_${account}`, value: formData.windowDays || "90", field: "windowDays" },
    ];

    try {
      for (const def of defs) {
        const existing = editingConfig?.params[def.field];
        if (existing) {
          await updateParameter({
            oldParameter: existing,
            newParameter: makeParam(def.name, def.value, existing.parameterId),
          });
        } else {
          await insertParameter({ payload: makeParam(def.name, def.value) });
        }
      }
      onSuccess(`Bonus for ${account} saved.`);
      setShowDialog(false);
      setEditingConfig(null);
    } catch (error) {
      onError(error, "Save Bonus Config", false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingConfig) return;
    const toDelete = [
      deletingConfig.params.startDate,
      deletingConfig.params.target,
      deletingConfig.params.reward,
      deletingConfig.params.windowDays,
    ].filter(Boolean) as Parameter[];

    try {
      for (const param of toDelete) {
        await deleteParameter(param);
      }
      onSuccess(`Bonus for ${deletingConfig.accountNameOwner} deleted.`);
    } catch (error) {
      onError(error, "Delete Bonus Config", false);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingConfig(null);
    }
  };

  const formatEndDate = (startDate: string, windowDays: number): string => {
    if (!startDate) return "—";
    const end = new Date(
      new Date(startDate + "T00:00:00").getTime() + (windowDays - 1) * 86400000,
    );
    return end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Spending Bonuses
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Track credit card spend-to-earn bonus offers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ backgroundColor: "primary.main" }}
        >
          Add Bonus
        </Button>
      </Box>

      {bonusConfigs.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No spending bonuses configured yet. Click "Add Bonus" to get started.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {bonusConfigs.map((config) => (
            <Card key={config.accountNameOwner} variant="outlined">
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, wordBreak: "break-word" }}
                  >
                    {config.accountNameOwner}
                  </Typography>
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(config)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setDeletingConfig(config);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                  <Chip
                    icon={<EmojiEventsIcon sx={{ fontSize: "0.9rem !important" }} />}
                    label={`${currencyFormat(config.rewardAmount)} bonus`}
                    size="small"
                    color="success"
                  />
                  <Chip
                    label={`${config.windowDays}d window`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ mb: 1 }} />

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  Spend {currencyFormat(config.targetAmount)} by{" "}
                  {formatEndDate(config.startDate, config.windowDays)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Started: {config.startDate || "—"}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <FormDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingConfig(null);
        }}
        onSubmit={handleSave}
        title={
          editingConfig
            ? `Edit Bonus — ${editingConfig.accountNameOwner}`
            : "Add Spending Bonus"
        }
        submitText={editingConfig ? "Save" : "Add"}
      >
        <TextField
          select
          label="Account"
          fullWidth
          margin="normal"
          value={formData.accountNameOwner}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, accountNameOwner: e.target.value }))
          }
          disabled={!!editingConfig}
          helperText={editingConfig ? "Account cannot be changed when editing" : undefined}
        >
          {(accounts ?? []).map((a) => (
            <MenuItem key={a.accountNameOwner} value={a.accountNameOwner}>
              {a.accountNameOwner}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Start Date"
          type="date"
          fullWidth
          margin="normal"
          value={formData.startDate}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, startDate: e.target.value }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Target Spend Amount ($)"
          type="number"
          fullWidth
          margin="normal"
          value={formData.targetAmount}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, targetAmount: e.target.value }))
          }
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />

        <TextField
          label="Bonus Reward Amount ($)"
          type="number"
          fullWidth
          margin="normal"
          value={formData.rewardAmount}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, rewardAmount: e.target.value }))
          }
          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
        />

        <TextField
          label="Window Duration (days)"
          type="number"
          fullWidth
          margin="normal"
          value={formData.windowDays}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, windowDays: e.target.value }))
          }
          slotProps={{ htmlInput: { min: 1 } }}
        />
      </FormDialog>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingConfig(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Spending Bonus"
        message={`Remove the bonus configuration for "${deletingConfig?.accountNameOwner}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </Box>
  );
}
