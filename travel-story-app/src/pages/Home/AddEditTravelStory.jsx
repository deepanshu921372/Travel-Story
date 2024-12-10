import React, { useState } from "react";
import { MdAdd, MdClose, MdUpdate, MdDeleteOutline } from "react-icons/md";
import DateSelector from "../../components/input/DateSelector";
import ImageSelector from "../../components/input/ImageSelector";
import TagInput from "../../components/input/TagInput";
import axiosInstance from "../../utils/axiosInstance";
import moment from "moment";
import uploadImage from "../../utils/uploadImage";
import { toast } from "react-toastify";

const AddEditTravelStory = ({
  storyInfo,
  type,
  onClose,
  getAllTravelStories,
}) => {
  const [title, setTitle] = useState(storyInfo?.title || "");
  const [storyImg, setStoryImg] = useState(storyInfo?.imageUrl || null);
  const [story, setStory] = useState(storyInfo?.story || "");
  const [visitedLocation, setVisitedLocation] = useState(
    storyInfo?.visitedLocation || []
  );
  const [visitedDate, setVisitedDate] = useState(
    storyInfo?.visitedDate || null
  );
  const [error, setError] = useState("");

  const updateTravelStory = async (id, data) => {
    const storyId = storyInfo._id;

    try {
      let imageUrl = "";

      let postData = {
        title,
        story,
        imageUrl: storyInfo.imageUrl || "",
        visitedLocation,
        visitedDate: visitedDate
          ? moment(visitedDate).valueOf()
          : moment().valueOf(),
      };

      if (typeof storyImg === "object") {
        const imageUploadRes = await uploadImage(storyImg);
        imageUrl = imageUploadRes.imageUrl || "";

        postData = {
          ...postData,
          imageUrl: imageUrl || "",
        };
      }
      const response = await axiosInstance.put(
        "/edit-story/" + storyId,
        postData
      );

      if (response.data) {
        toast.success("Story updated successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        await getAllTravelStories();
        onClose();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("Failed to add story. Please try again.");
      }
    }
  };

  const addNewTravelStory = async () => {
    try {
      let imageUrl = "";
      if (storyImg) {
        const imageUploadRes = await uploadImage(storyImg);
        imageUrl = imageUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post("/add-travel-story", {
        title,
        imageUrl: imageUrl || "",
        story,
        visitedLocation,
        visitedDate: visitedDate
          ? moment(visitedDate).valueOf()
          : moment().valueOf(),
      });

      // Modified success condition to be more flexible
      if (response.data) {
        toast.success("Story added successfully", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        await getAllTravelStories();
        onClose();
      }
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("Failed to add story. Please try again.");
      }
    }
  };

  const handleAddOrUpdateClick = () => {
    console.log(
      "Input Data: ",
      title,
      storyImg,
      story,
      visitedLocation,
      visitedDate
    );
    if (!title) {
      setError("Please enter the title");
      return;
    }
    if (!story) {
      setError("Please enter the story");
      return;
    }
    setError("");

    if (type === "edit") {
      updateTravelStory(storyInfo._id, {
        title,
        storyImg,
        story,
        visitedLocation,
        visitedDate,
      });
    } else {
      addNewTravelStory();
    }
  };

  const handleDeleteStoryImg = async () => {
    const deleteImgRes = await axiosInstance.delete("/delete-image/", {
      params: {
        imageUrl: storyInfo.imageUrl,
      },
    });

    if (deleteImgRes.data) {
      const storyId = storyInfo._id;
      const postData = {
        title,
        story,
        visitedLocation,
        visitedDate: moment().valueOf(),
        imageUrl: "",
      };
      const response = await axiosInstance.put(
        "/edit-story/" + storyId,
        postData
      );

      setStoryImg(null);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between">
        <h5 className="text-xl font-medium text-slate-700">
          {type === "add" ? "Add Story" : "Update Story"}
        </h5>
        <div>
          <div className="flex items-center gap-3 bg-cyan-50/50 rounded-l-lg">
            {type === "add" ? (
              <button className="btn-small" onClick={handleAddOrUpdateClick}>
                <MdAdd className="text-lg" /> ADD STORY
              </button>
            ) : (
              <>
                <button className="btn-small" onClick={handleAddOrUpdateClick}>
                  <MdUpdate className="text-lg" /> UPDATE STORY
                </button>
              </>
            )}

            <button onClick={onClose}>
              <MdClose className="text-xl text-slate-400" />
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-rightpt-2">{error}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex-1 flex flex-col gap-2 pt-4">
          <div className="flex flex-col gap-2">
            <label className="input-label">TITLE</label>
            <input
              type="text"
              className="text-2xl text-slate-950 outline-none"
              placeholder="A Day at the Great Wall"
              value={title}
              onChange={({ target }) => setTitle(target.value)}
            />

            <div className="my-3">
              <DateSelector date={visitedDate} setDate={setVisitedDate} />
            </div>

            <ImageSelector
              image={storyImg}
              setImage={setStoryImg}
              label="STORY IMAGE"
              handleDeleteImage={handleDeleteStoryImg}
            />

            <div className="flex flex-col gap-2 mt-4">
              <label className="input-label">STORY</label>
              <textarea
                type="text"
                className="text-sm text-slate-950 outline-none bg-slate-50 p-2 rounded"
                placeholder="Write your story here..."
                rows={10}
                value={story}
                onChange={({ target }) => setStory(target.value)}
              />
            </div>

            <div className="pt-3">
              <label className="input-label">VISITED LOCATIONS</label>
              <TagInput tags={visitedLocation} setTags={setVisitedLocation} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditTravelStory;
