const { jsPDF } = window.jspdf;

function calculateEstimate(formData, rates) {
  const totalItems = formData.rooms.reduce((sum, room) => sum + room.furnitureItems.length + room.packingItems.length, 0);
  let totalMaterialsCost = rates.materialsCost + (parseFloat(formData.materials) || 0);

  formData.rooms.forEach(room => {
    const mat = room.estimatedMaterials;
    const override = room.overrideMaterials;
    totalMaterialsCost += (mat.boxes + override.boxes) * rates.boxCost;
    totalMaterialsCost += (mat.bubbleWrapFeet + override.bubbleWrapFeet) * rates.bubbleWrapCostPerFoot;
    totalMaterialsCost += (mat.paperPadBoxes + override.paperPadBoxes) * rates.paperPadCostPerBox;
    totalMaterialsCost += (mat.dishPacks + override.dishPacks) * rates.dishPackCost;
  });

  const laborLow = formData.movers * rates.moverHourly * (parseFloat(formData.hoursLow) || 0);
  const laborHigh = formData.movers * rates.moverHourly * (parseFloat(formData.hoursHigh) || 0);
  const vehicleLow = formData.vehicles * rates.vehicleFlat + formData.mileage * rates.mileageRate;
  const vehicleHigh = vehicleLow * 1.2;
  const packingCost = formData.packing ? rates.packingFee : 0;
  const itemCost = totalItems * rates.itemHandling;
  const low = (laborLow + vehicleLow + packingCost + itemCost + totalMaterialsCost).toFixed(2);
  const high = (laborHigh + vehicleHigh + packingCost + itemCost + totalMaterialsCost).toFixed(2);
  return { low, high };
}

function generatePDF(formData, calculateEstimate) {
  const { low, high } = calculateEstimate();
  const doc = new jsPDF();
  doc.text(`Quote for ${formData.clientName}`, 10, 10);
  doc.text(`Total Estimate: $${low} - $${high}`, 10, 20);
  doc.text(`Number of Movers: ${formData.movers}`, 10, 30);
  doc.text(`Labor Hours (Low/High): ${formData.hoursLow}/${formData.hoursHigh}`, 10, 40);
  doc.text(`Number of Vehicles: ${formData.vehicles}`, 10, 50);
  doc.text(`Mileage (miles): ${formData.mileage}`, 10, 60);
  doc.text(`Packing Service: ${formData.packing ? 'Yes' : 'No'}`, 10, 70);
  doc.text(`Additional Materials Cost: $${formData.materials}`, 10, 80);
  doc.text('Rooms:', 10, 90);
  let yPos = 100;
  formData.rooms.forEach((room, rIdx) => {
    doc.text(`${room.name} (${room.width}x${room.length} ft):`, 10, yPos);
    yPos += 10;
    doc.text('  Furniture Items:', 10, yPos);
    yPos += 10;
    room.furnitureItems.forEach((item, i) => {
      doc.text(`    - ${item.id}: ${item.name} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`, 10, yPos);
      yPos += 10;
    });
    doc.text('  Packing Items:', 10, yPos);
    yPos += 10;
    room.packingItems.forEach((item, i) => {
      doc.text(`    - ${item.id}: ${item.name} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`, 10, yPos);
      yPos += 10;
    });
    const mat = room.estimatedMaterials;
    const override = room.overrideMaterials;
    doc.text(`  Estimated Materials (Auto + Override): ${(mat.boxes + override.boxes)} boxes, ${(mat.bubbleWrapFeet + override.bubbleWrapFeet)} ft bubble wrap, ${(mat.paperPadBoxes + override.paperPadBoxes)} paper pad boxes, ${(mat.dishPacks + override.dishPacks)} dish packs`, 10, yPos);
    yPos += 10;
  });
  doc.save(`${formData.clientName}_quote.pdf`);
}

function exportToCSV(formData, calculateEstimate) {
  const { low, high } = calculateEstimate();
  const headers = ['Client Name', 'Number of Movers', 'Labor Hours Low', 'Labor Hours High', 'Number of Vehicles', 'Mileage (miles)', 'Packing Service', 'Materials Cost', 'Total Low', 'Total High', 'Rooms'];
  const roomsStr = formData.rooms.map(room =>
    `${room.name} (${room.width}x${room.length}): Furniture - ${room.furnitureItems.map(item => `${item.id}: ${item.name} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`).join('; ')}; Packing - ${room.packingItems.map(item => `${item.id}: ${item.name} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`).join('; ')}; Materials - Boxes: ${room.estimatedMaterials.boxes + room.overrideMaterials.boxes}, Bubble: ${room.estimatedMaterials.bubbleWrapFeet + room.overrideMaterials.bubbleWrapFeet}ft, Paper Pads: ${room.estimatedMaterials.paperPadBoxes + room.overrideMaterials.paperPadBoxes}, Dish Packs: ${room.estimatedMaterials.dishPacks + room.overrideMaterials.dishPacks}`
  ).join(' | ');
  const row = [
    formData.clientName,
    formData.movers,
    formData.hoursLow,
    formData.hoursHigh,
    formData.vehicles,
    formData.mileage,
    formData.packing,
    formData.materials,
    low,
    high,
    roomsStr,
  ];
  const csv = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formData.clientName}_assessment.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function analyzeRoomPhoto(photoUrl, roomIndex, aggregate, formData, setFormData, itemCounter, setItemCounter, model, loadingModel) {
  if (loadingModel || !model) return;

  try {
    const img = new Image();
    img.src = photoUrl;
    img.onload = async () => {
      const predictions = await model.detect(img);
      let dishCount = 0;
      let bookCount = 0;

      predictions.forEach(pred => {
        if (['cup', 'bowl', 'bottle', 'wine glass', 'fork', 'knife', 'spoon'].includes(pred.class)) {
          dishCount++;
        } else if (pred.class === 'book') {
          bookCount++;
        }
      });

      const dishPacks = Math.ceil(dishCount / 20);
      const paperPadBoxes = Math.ceil((dishCount * 4) / 25);
      const bubbleWrapFeet = dishCount * 2;
      const boxes = Math.ceil(dishCount / 20) + Math.ceil(bookCount / 30);

      const newRooms = [...formData.rooms];
      if (aggregate) {
        newRooms[roomIndex].estimatedMaterials.boxes += boxes;
        newRooms[roomIndex].estimatedMaterials.bubbleWrapFeet += bubbleWrapFeet;
        newRooms[roomIndex].estimatedMaterials.paperPadBoxes += paperPadBoxes;
        newRooms[roomIndex].estimatedMaterials.dishPacks += dishPacks;
      } else {
        newRooms[roomIndex].estimatedMaterials = { boxes, bubbleWrapFeet, paperPadBoxes, dishPacks };
      }

      if (!aggregate) {
        if (dishCount > 0) {
          newRooms[roomIndex].packingItems.push({
            id: `Item-${itemCounter}`,
            name: `Detected Dishes (${dishCount})`,
            width: '',
            length: '',
            height: '',
            packingItem: true
          });
          setItemCounter(itemCounter + 1);
        }
        if (bookCount > 0) {
          newRooms[roomIndex].packingItems.push({
            id: `Item-${itemCounter}`,
            name: `Detected Books (${bookCount})`,
            width: '',
            length: '',
            height: '',
            packingItem: true
          });
          setItemCounter(itemCounter + 1);
        }
      }
      setFormData({ ...formData, rooms: newRooms });
      URL.revokeObjectURL(photoUrl);
    };
  } catch (err) {
    console.error('Photo analysis failed:', err);
    alert('Failed to analyze room photo. Try another image or use manual overrides.');
    URL.revokeObjectURL(photoUrl);
  }
}

function analyzeFurniturePhoto(photoUrl, roomIndex, itemIndex, formData, setFormData, model, loadingModel) {
  if (loadingModel || !model) return;

  try {
    const img = new Image();
    img.src = photoUrl;
    img.onload = async () => {
      const predictions = await model.detect(img);
      let furnitureType = 'Dresser';
      let dimensions = { width: '3.5', length: '1.5', height: '3' };

      const furnitureClasses = ['bed', 'chair', 'couch', 'dining table', 'potted plant', 'tv'];
      const detected = predictions.find(pred => furnitureClasses.includes(pred.class));
      if (detected) {
        furnitureType = detected.class.charAt(0).toUpperCase() + detected.class.slice(1);
        switch (detected.class) {
          case 'bed': dimensions = { width: '6', length: '7', height: '2' }; break;
          case 'chair': dimensions = { width: '3', length: '3', height: '3' }; break;
          case 'couch': dimensions = { width: '7', length: '3', height: '3' }; break;
          case 'dining table': dimensions = { width: '6', length: '4', height: '3' }; break;
          case 'potted plant': dimensions = { width: '2', length: '2', height: '3' }; break;
          case 'tv': dimensions = { width: '4', length: '2', height: '3' }; break;
        }
      }

      const newRooms = [...formData.rooms];
      newRooms[roomIndex].furnitureItems[itemIndex].name = `Detected ${furnitureType}`;
      newRooms[roomIndex].furnitureItems[itemIndex].width = dimensions.width;
      newRooms[roomIndex].furnitureItems[itemIndex].length = dimensions.length;
      newRooms[roomIndex].furnitureItems[itemIndex].height = dimensions.height;
      setFormData({ ...formData, rooms: newRooms });
    };
  } catch (err) {
    console.error('Furniture photo analysis failed:', err);
    alert('Failed to analyze furniture photo. Edit item name and dimensions manually.');
  }
}