import { useMatchingState } from "@/stores/matching-store";
import DifficultySelector from "./dfficulty-selector";
import MatchQueueTimer from "./match-queue-timer";

const Matchmaking = () => {
  const { isMatching, roomId: isMatched } = useMatchingState();

  return isMatched ? <></> : isMatching ? <MatchQueueTimer /> : <DifficultySelector />;
};

export default Matchmaking;
