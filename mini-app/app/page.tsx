import { generateMetadata } from "@/lib/farcaster-embed";
import TetrisGame from "@/components/tetris-game";

export { generateMetadata };

export default function Home() {
  return <TetrisGame />;
}
