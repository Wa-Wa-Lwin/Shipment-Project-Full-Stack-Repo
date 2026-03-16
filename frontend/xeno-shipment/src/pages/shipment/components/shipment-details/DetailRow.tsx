import type { DetailRowProps } from './types';
import { isUrl } from './utils';

const DetailRow = ({ label, value }: DetailRowProps) => {
  const renderValue = () => {
    if (value == null) return "N/A";

    const stringValue = String(value);
    if (isUrl(stringValue)) {
      return (
        <>
          <a
            href={stringValue}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
          >
            View
          </a>
        </>
      );
    }

    return stringValue;
  };

  return (
    <div className="flex justify-start items-center py-1 text-sm">
      <span className="text-gray-600 font-bold">{label}:</span>
      <span className={`ml-2 ${value == null ? "text-red-500 italic" : "text-gray-800"}`}>
        {renderValue()}
      </span>
    </div>
  );
};

export default DetailRow;