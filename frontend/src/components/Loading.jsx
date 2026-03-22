import { Loader2 } from 'lucide-react';

export default function Loading({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100"></div>
        <Loader2 className="absolute top-0 left-0 h-16 w-16 text-indigo-600 animate-spin" />
      </div>
      <p className="mt-6 text-gray-500 font-medium">{message}</p>
    </div>
  );
}
