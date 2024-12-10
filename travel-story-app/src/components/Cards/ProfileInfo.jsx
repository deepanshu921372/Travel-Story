import React from "react";
import { getInitials } from "../../utils/helper";

const ProfileInfo = ({ userInfo, onLogout }) => {
  return (
    userInfo && (
      <div className="flex items-center flex-col md:flex-row lg:flex-row gap-3">
        <div className="w-5 h-5 md:w-12 md:h-12 lg:w-12 lg:h-12 flex items-center justify-center rounded-full text-slate-950 font-medium bg-slate-100">
          {getInitials(userInfo?.fullName || "")}
        </div>

        <div>
          <p className="text-sm hidden lg:block font-medium">
            {userInfo?.fullName || ""}
          </p>
          <button
            className="text-sm text-slate-700 underline"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </div>
    )
  );
};

export default ProfileInfo;
