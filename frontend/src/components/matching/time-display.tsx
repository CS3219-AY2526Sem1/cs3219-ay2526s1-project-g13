import { Typography } from "@mui/material";

interface TimeDisplayProps {
  count: number;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ count }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Typography
      variant="h6"
      color="primary"
      fontWeight="bold"
      sx={{
        fontFamily: "monospace",
        fontSize: "1.2rem",
      }}
    >
      {formatTime(count)}
    </Typography>
  );
};

export default TimeDisplay;
