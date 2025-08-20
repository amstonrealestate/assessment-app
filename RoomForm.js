const { useCallback } = React;

function RoomForm({ formData, setFormData, model, loadingModel, itemCounter, setItemCounter }) {
  const handleInputChange = (e, roomIndex, itemIndex = null, field = null, type = 'furniture') => {
    if (itemIndex === null) {
      const newRooms = [...formData.rooms];
      newRooms[roomIndex][e.target.name] = e.target.value;
      setFormData({ ...formData, rooms: newRooms });
    } else {
      const newRooms = [...formData.rooms];
      const itemList = type === 'furniture' ? newRooms[roomIndex].furnitureItems : newRooms[roomIndex].packingItems;
      itemList[itemIndex][field] = field === 'packingItem' ? e.target.checked : e.target.value;
      setFormData({ ...formData, rooms: newRooms });
    }
  };

  const handleOverrideChange = (e, roomIndex, field) => {
    const newRooms = [...formData.rooms];
    newRooms[roomIndex].overrideMaterials[field] = parseFloat(e.target.value) || 0;
    setFormData({ ...formData, rooms: newRooms });
  };

  const addRoom = () => {
    setFormData({
      ...formData,
      rooms: [...formData.rooms, {
        name: '',
        width: '',
        length: '',
        furnitureItems: [],
        packingItems: [],
        photos: [],
        estimatedMaterials: { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 },
        overrideMaterials: { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 }
      }],
    });
  };

  const addFurnitureItem = (roomIndex) => {
    const newRooms = [...formData.rooms];
    newRooms[roomIndex].furnitureItems.push({
      id: `Item-${itemCounter}`,
      name: '',
      width: '',
      length: '',
      height: '',
      packingItem: false,
      photo: null
    });
    setFormData({ ...formData, rooms: newRooms });
    setItemCounter(itemCounter + 1);
  };

  const addPackingItem = (roomIndex) => {
    const newRooms = [...formData.rooms];
    newRooms[roomIndex].packingItems.push({
      id: `Item-${itemCounter}`,
      name: '',
      width: '',
      length: '',
      height: '',
      packingItem: true
    });
    setFormData({ ...formData, rooms: newRooms });
    setItemCounter(itemCounter + 1);
  };

  const removeItem = (roomIndex, itemIndex, type = 'furniture') => {
    const newRooms = [...formData.rooms];
    const itemList = type === 'furniture' ? newRooms[roomIndex].furnitureItems : newRooms[roomIndex].packingItems;
    const item = itemList[itemIndex];
    if (item.photo) URL.revokeObjectURL(item.photo);
    itemList.splice(itemIndex, 1);
    setFormData({ ...formData, rooms: newRooms });
  };

  const handleRoomPhotoUpload = useCallback((e, roomIndex) => {
    const files = e.target.files;
    if (files.length > 0) {
      const newRooms = [...formData.rooms];
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      newRooms[roomIndex].photos.push(...newPhotos);
      setFormData({ ...formData, rooms: newRooms });

      newPhotos.forEach((photoUrl, index) => {
        setTimeout(() => analyzeRoomPhoto(photoUrl, roomIndex, true, formData, setFormData, itemCounter, setItemCounter, model, loadingModel), (index + 1) * 1000);
      });
    }
  }, [formData.rooms, model, loadingModel, itemCounter]);

  const handleFurniturePhotoUpload = useCallback((e, roomIndex, itemIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    const newRooms = [...formData.rooms];
    const photoUrl = URL.createObjectURL(file);
    newRooms[roomIndex].furnitureItems[itemIndex].photo = photoUrl;
    setFormData({ ...formData, rooms: newRooms });

    setTimeout(() => analyzeFurniturePhoto(photoUrl, roomIndex, itemIndex, formData, setFormData, model, loadingModel), 1000);
  }, [formData.rooms, model, loadingModel]);

  const removeRoomPhoto = (roomIndex, photoIndex) => {
    const newRooms = [...formData.rooms];
    const photoUrl = newRooms[roomIndex].photos[photoIndex];
    newRooms[roomIndex].photos.splice(photoIndex, 1);
    URL.revokeObjectURL(photoUrl);
    newRooms[roomIndex].estimatedMaterials = { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 };
    newRooms[roomIndex].packingItems = [];
    newRooms[roomIndex].photos.forEach((photoUrl, index) => {
      setTimeout(() => analyzeRoomPhoto(photoUrl, roomIndex, index > 0, formData, setFormData, itemCounter, setItemCounter, model, loadingModel), (index + 1) * 1000);
    });
    setFormData({ ...formData, rooms: newRooms });
  };

  const removeFurniturePhoto = (roomIndex, itemIndex) => {
    const newRooms = [...formData.rooms];
    const item = newRooms[roomIndex].furnitureItems[itemIndex];
    if (item.photo) URL.revokeObjectURL(item.photo);
    newRooms[roomIndex].furnitureItems[itemIndex].photo = null;
    setFormData({ ...formData, rooms: newRooms });
  };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Rooms in New Space</h2>
      {formData.rooms.map((room, roomIndex) => (
        <div key={roomIndex} className="mb-4 p-4 border rounded bg-white">
          <input
            type="text"
            name="name"
            value={room.name}
            onChange={(e) => handleInputChange(e, roomIndex)}
            className="w-full p-2 border rounded mb-2"
            placeholder="Room Name (e.g., Living Room)"
            required
          />
          <div className="flex gap-2 mb-2">
            <input
              type="number"
              name="width"
              value={room.width}
              onChange={(e) => handleInputChange(e, roomIndex)}
              className="w-1/2 p-2 border rounded"
              placeholder="Width (ft) - optional"
            />
            <input
              type="number"
              name="length"
              value={room.length}
              onChange={(e) => handleInputChange(e, roomIndex)}
              className="w-1/2 p-2 border rounded"
              placeholder="Length (ft) - optional"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium">Upload Room Photo(s)/Video(s) (for packing items like dishes)</label>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => handleRoomPhotoUpload(e, roomIndex)}
              className="w-full p-2 border rounded"
            />
          </div>

          {room.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {room.photos.map((photoUrl, photoIndex) => (
                <div key={photoIndex} className="relative">
                  {photoUrl.startsWith('data:video/') ? (
                    <video src={photoUrl} controls className="w-full h-20 object-cover rounded" />
                  ) : (
                    <img src={photoUrl} alt={`Room Photo ${photoIndex + 1}`} className="w-full h-20 object-cover rounded" />
                  )}
                  <button
                    onClick={() => removeRoomPhoto(roomIndex, photoIndex)}
                    className="absolute top-0 right-0 bg-red-500 text-white px-1 py-0.5 text-xs rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mb-2 text-sm">
            Auto-Estimated Materials: {room.estimatedMaterials.boxes} boxes, {room.estimatedMaterials.bubbleWrapFeet} ft bubble wrap, {room.estimatedMaterials.paperPadBoxes} paper pad boxes, {room.estimatedMaterials.dishPacks} dish packs
          </div>

          <div className="mb-2">
            <h3 className="text-md font-medium mb-1">Manual Material Overrides (Add/Adjust)</h3>
            <div className="grid grid-cols-2 gap-2">
              {['boxes', 'bubbleWrapFeet', 'paperPadBoxes', 'dishPacks'].map(field => (
                <div key={field}>
                  <label className="block text-sm">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                  <input
                    type="number"
                    value={room.overrideMaterials[field]}
                    onChange={(e) => handleOverrideChange(e, roomIndex, field)}
                    className="w-full p-1 border rounded"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <h3 className="text-md font-medium mb-1">Furniture Items (e.g., sofas, beds)</h3>
          {room.furnitureItems.map((item, itemIndex) => (
            <div key={itemIndex} className="mb-2 p-2 border rounded flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.id}</span>
                  <input
                    type="text"
                    placeholder="Item name (e.g., Sofa, Bed)"
                    value={item.name}
                    onChange={(e) => handleInputChange(e, roomIndex, itemIndex, 'name', 'furniture')}
                    className="w-full p-1 border rounded"
                    required
                  />
                </div>
                {item.name.startsWith('Detected') && (
                  <p className="text-xs text-gray-500">Auto-detected item (edit name/dimensions if needed)</p>
                )}
                <div className="flex gap-2 mb-1">
                  {['width', 'length', 'height'].map(field => (
                    <input
                      key={field}
                      type="number"
                      placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} (ft) - optional`}
                      value={item[field]}
                      onChange={(e) => handleInputChange(e, roomIndex, itemIndex, field, 'furniture')}
                      className="w-1/3 p-1 border rounded"
                    />
                  ))}
                </div>
                <div className="mb-1">
                  <label className="block text-sm font-medium">Upload Furniture Photo/Video</label>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFurniturePhotoUpload(e, roomIndex, itemIndex)}
                    className="w-full p-1 border rounded"
                  />
                </div>
                {item.photo && (
                  <div className="relative w-20 h-20">
                    {item.photo.startsWith('data:video/') ? (
                      <video src={item.photo} controls className="w-full h-full object-cover rounded" />
                    ) : (
                      <img src={item.photo} alt="Furniture" className="w-full h-full object-cover rounded" />
                    )}
                    <button
                      onClick={() => removeFurniturePhoto(roomIndex, itemIndex)}
                      className="absolute top-0 right-0 bg-red-500 text-white px-1 py-0.5 text-xs rounded"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <label className="flex items-center mt-1 text-sm">
                  <input
                    type="checkbox"
                    checked={item.packingItem}
                    onChange={(e) => handleInputChange(e, roomIndex, itemIndex, 'packingItem', 'furniture')}
                    className="mr-2"
                  />
                  Move to Packing Items (e.g., small items)
                </label>
              </div>
              <button
                onClick={() => removeItem(roomIndex, itemIndex, 'furniture')}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addFurnitureItem(roomIndex)}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Add Furniture Item to {room.name || 'this Room'}
          </button>

          <h3 className="text-md font-medium mb-1 mt-4">Packing Items (e.g., dishes, books)</h3>
          {room.packingItems.map((item, itemIndex) => (
            <div key={itemIndex} className="mb-2 p-2 border rounded flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.id}</span>
                  <input
                    type="text"
                    placeholder="Item name (e.g., Dishes, Books)"
                    value={item.name}
                    onChange={(e) => handleInputChange(e, roomIndex, itemIndex, 'name', 'packing')}
                    className="w-full p-1 border rounded"
                    required
                  />
                </div>
                {item.name.startsWith('Detected') && (
                  <p className="text-xs text-gray-500">Auto-detected item (edit name if needed)</p>
                )}
              </div>
              <button
                onClick={() => removeItem(roomIndex, itemIndex, 'packing')}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => addPackingItem(roomIndex)}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Add Packing Item to {room.name || 'this Room'}
          </button>
        </div>
      ))}
      <button
        onClick={addRoom}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Add New Room
      </button>
    </div>
  );
}