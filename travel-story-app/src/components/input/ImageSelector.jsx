import React, { useEffect, useRef, useState } from "react";
import { FaRegFileImage } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";

const ImageSelector = ({ image, setImage, handleDeleteImage }) => {
  const inputRef = useRef(null);
  const [priviewUrl, setPriviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    handleDeleteImage();
  };

  useEffect(() => {
    if (typeof image === "string") {
      setPriviewUrl(image);
    } else if (image) {
      setPriviewUrl(URL.createObjectURL(image));
    } else {
      setPriviewUrl(null);
    }

    return () => {
      if (priviewUrl && typeof priviewUrl === "string" && !image) {
        URL.revokeObjectURL(priviewUrl);
      }
    };
  }, [image]);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {!image ? (
        <button
          className="w-full h-[220px] flex flex-col items-center justify-center gap-4 bg-slate-50 rounded border border-slate-200/50"
          onClick={() => onChooseFile()}
        >
          <div className="w-14 h-14 bg-cyan-50 rounded-full flex items-center justify-center border border-cyan-100">
            <FaRegFileImage className="text-xl text-cyan-500" />
          </div>

          <p className="text-sm text-slate-500">Browse image files to upload</p>
        </button>
      ) : (
        <div className="w-full relative">
          <img
            src={priviewUrl}
            alt="Selected Image"
            className="w-full h-[300px] object-cover rounded-lg"
          />

          <button
            onClick={handleRemoveImage}
            className="btn-small btn-delete absolute top-2 right-2"
          >
            <MdDeleteOutline className="text-lg" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageSelector;
