import { Button, Stack, Typography } from "@mui/material";
import { DIFFICULTY } from "@/utils/enums";
import { useMatchingState, useMatchingActions } from "@/stores/matching-store";
import { FC } from "react";

type Props = {
  hideLabel?: boolean;
  large?: boolean;
};

const DifficultySelector: FC<Props> = ({ hideLabel, large }) => {
  const { isMatching } = useMatchingState();
  const { startMatch } = useMatchingActions();

  return (
    <Stack flexDirection="row" columnGap={2} alignItems="center">
      {hideLabel ? (
        <></>
      ) : (
        <Typography variant="subtitle1" color="primary" fontWeight={500}>
          Quick Match:
        </Typography>
      )}
      <Stack flexDirection="row" columnGap={large ? 2 : 1}>
        {Object.values(DIFFICULTY).map((difficulty) => {
          return (
            <Button
              key={difficulty}
              type="submit"
              variant="contained"
              size={large ? "large" : "small"}
              sx={{
                bgcolor:
                  difficulty === "EASY"
                    ? "success.main"
                    : difficulty === "MEDIUM"
                      ? "warning.main"
                      : "error.main",
                fontWeight: 500,
                textTransform: "capitalize",
                transitionProperty: "background-color",
                transitionDuration: "0.15s",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor:
                    difficulty === "EASY"
                      ? "success.dark"
                      : difficulty === "MEDIUM"
                        ? "warning.dark"
                        : "error.dark",
                },
              }}
              disabled={isMatching}
              onClick={() => startMatch(difficulty)}
            >
              {difficulty.toLowerCase()}
            </Button>
          );
        })}
      </Stack>
    </Stack>
  );
};

export default DifficultySelector;
