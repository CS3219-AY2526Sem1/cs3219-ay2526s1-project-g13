import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useMatchingState, useMatchingActions } from "@/stores/matching-store";
import TimeDisplay from "./time-display";

const MatchQueueTimer = () => {
  const { count } = useMatchingState();
  const { stopQueuing } = useMatchingActions();

  return (
    <Stack flexDirection="row" alignItems="center">
      <Stack>
        <Stack flexDirection="row" alignItems="center">
          <Typography variant="caption" color="primary" sx={{ mr: 1 }}>
            Finding Match
          </Typography>
        </Stack>
        <TimeDisplay count={count ?? 0} />
      </Stack>
      <Tooltip title="Cancel matchmaking">
        <IconButton onClick={stopQueuing} sx={{ color: "error.main" }}>
          ✕
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export default MatchQueueTimer;
