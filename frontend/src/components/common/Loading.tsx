
interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

const Loading = ({ message = 'Loading...', fullScreen = false }: LoadingProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? 'min-h-screen' : 'min-h-[200px]'
      }`}
    >
      {/* Spinner */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
      </div>

      {message && (
        <p className="text-sm text-slate-500 font-medium">{message}</p>
      )}
    </div>
  );
};

export default Loading;