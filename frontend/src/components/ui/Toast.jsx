const styles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
  warning: "bg-yellow-500 text-black",
};

const Toast = ({ type, message }) => {
  return (
    <div
      className={`px-4 py-3 rounded-md shadow-lg text-sm font-medium animate-slide-in ${styles[type]}`}
    >
      {message}
    </div>
  );
};

export default Toast;
