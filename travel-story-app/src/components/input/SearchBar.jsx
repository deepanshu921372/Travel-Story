import React from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

const SearchBar = ({value, onChange, handleSearch, onClearSearch}) => {
  return (
    <div className="w-80 flex items-center mr-2 lg:mr-0 px-4 bg-slate-100 rounded-md">
      <input
        type="text"
        placeholder="Search Notes"
        className="w-[100px] lg:w-full text-xs bg-transparent py-[11px] outline-none"
        value={value}
        onChange={onChange}
      />

      {value && (
        <IoMdClose className="text-slate-500 text-xl cursor-pointer mr-3 hover:text-black" onClick={onClearSearch} />
      )}

      <FaMagnifyingGlass className="text-slate-400 cursor-pointer hover:text-black" onClick={handleSearch} />
    </div>
  );
};

export default SearchBar;
