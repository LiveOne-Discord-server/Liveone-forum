
import { Pin } from "lucide-react";

const PinnedBadge: React.FC = () => {
  return (
    <div className="bg-orange-500 text-white px-4 py-1 flex items-center justify-center text-xs">
      <Pin className="h-3 w-3 mr-1" /> Pinned Post
    </div>
  );
};

export default PinnedBadge;
