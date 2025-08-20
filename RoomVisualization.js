const { useRef, useEffect } = React;

function RoomVisualization({ formData, selectedRoomIndex, setSelectedRoomIndex }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 10;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const room = formData.rooms[selectedRoomIndex];
    if (!room) return;

    const roomWidth = parseFloat(room.width) * scale || 100;
    const roomLength = parseFloat(room.length) * scale || 100;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(0, 0, roomWidth, roomLength);

    room.furnitureItems.forEach((item, i) => {
      if (item.packingItem) return;
      const width = parseFloat(item.width) * scale || 10;
      const length = parseFloat(item.length) * scale || 10;
      ctx.fillStyle = `hsl(${i * 60}, 50%, 50%)`;
      ctx.fillRect(10 + i * 20, 10 + i * 20, width, length);
      ctx.fillStyle = 'white';
      ctx.fillText(`${item.id}: ${item.name}`, 12 + i * 20, 20 + i * 20);
    });
  }, [formData.rooms, selectedRoomIndex]);

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Room Visualization</h2>
      <select
        value={selectedRoomIndex}
        onChange={(e) => setSelectedRoomIndex(parseInt(e.target.value))}
        className="w-full p-2 border rounded mb-2"
      >
        {formData.rooms.map((room, index) => (
          <option key={index} value={index}>
            {room.name || `Room ${index + 1}`}
          </option>
        ))}
      </select>
      <canvas ref={canvasRef} width="300" height="300" className="w-full"></canvas>
      <p className="text-sm text-gray-600">Preview of furniture items in selected room (colored rectangles). Packing items (e.g., dishes) are excluded.</p>
    </div>
  );
}