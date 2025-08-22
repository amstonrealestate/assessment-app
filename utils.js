const { jsPDF } = window.jspdf;

function calculateEstimate(formData, rates) {
  if (!formData || !formData.rooms) {
    return { low: '0.00', high: '0.00' };
  }

  const totalItems = formData.rooms.reduce((sum, room) => sum + (room.furnitureItems?.length || 0) + (room.packingItems?.length || 0), 0);
  let totalMaterialsCost = (rates?.materialsCost || 0) + (parseFloat(formData.materials) || 0);

  formData.rooms.forEach(room => {
    const mat = room.estimatedMaterials || { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 };
    const override = room.overrideMaterials || { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 };
    totalMaterialsCost += (mat.boxes + override.boxes) * (rates?.boxCost || 0);
    totalMaterialsCost += (mat.bubbleWrapFeet + override.bubbleWrapFeet) * (rates?.bubbleWrapCostPerFoot || 0);
    totalMaterialsCost += (mat.paperPadBoxes + override.paperPadBoxes) * (rates?.paperPadCostPerBox || 0);
    totalMaterialsCost += (mat.dishPacks + override.dishPacks) * (rates?.dishPackCost || 0);
  });

  const laborLow = (formData.movers || 0) * (rates?.moverHourly || 0) * (parseFloat(formData.hoursLow) || 0);
  const laborHigh = (formData.movers || 0) * (rates?.moverHourly || 0) * (parseFloat(formData.hoursHigh) || 0);
  const vehicleLow = (formData.vehicles || 0) * (rates?.vehicleFlat || 0) + (formData.mileage || 0) * (rates?.mileageRate || 0);
  const vehicleHigh = vehicleLow * 1.2;
  const packingCost = formData.packing ? (rates?.packingFee || 0) : 0;
  const itemCost = totalItems * (rates?.itemHandling || 0);
  const low = (laborLow + vehicleLow + packingCost + itemCost + totalMaterialsCost).toFixed(2);
  const high = (laborHigh + vehicleHigh + packingCost + itemCost + totalMaterialsCost).toFixed(2);
  return { low, high };
}

function generatePDF(formData, calculateEstimate) {
  const { low, high } = calculateEstimate();
  const doc = new jsPDF();
  doc.text(`Quote for ${formData.clientName || 'Unknown'}`, 10, 10);
  doc.text(`Total Estimate: $${low} - $${high}`, 10, 20);
  doc.text(`Number of Movers: ${formData.movers || 0}`, 10, 30);
  doc.text(`Labor Hours (Low/High): ${formData.hoursLow || 0}/${formData.hoursHigh || 0}`, 10, 40);
  doc.text(`Number of Vehicles: ${formData.vehicles || 0}`, 10, 50);
  doc.text(`Mileage (miles): ${formData.mileage || 0}`, 10, 60);
  doc.text(`Packing Service: ${formData.packing ? 'Yes' : 'No'}`, 10, 70);
  doc.text(`Additional Materials Cost: $${formData.materials || 0}`, 10, 80);
  doc.text('Rooms:', 10, 90);
  let yPos = 100;
  (formData.rooms || []).forEach((room, rIdx) => {
    doc.text(`${room.name || 'Unnamed'} (${room.width || 'N/A'}x${room.length || 'N/A'} ft):`, 10, yPos);
    yPos += 10;
    doc.text('  Furniture Items:', 10, yPos);
    yPos += 10;
    (room.furnitureItems || []).forEach((item, i) => {
      doc.text(`    - ${item.id}: ${item.name || 'Unknown'} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`, 10, yPos);
      yPos += 10;
    });
    doc.text('  Packing Items:', 10, yPos);
    yPos += 10;
    (room.packingItems || []).forEach((item, i) => {
      doc.text(`    - ${item.id}: ${item.name || 'Unknown'} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`, 10, yPos);
      yPos += 10;
    });
    const mat = room.estimatedMaterials || { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 };
    const override = room.overrideMaterials || { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 };
    doc.text(`  Estimated Materials (Auto + Override): ${(mat.boxes + override.boxes)} boxes, ${(mat.bubbleWrapFeet + override.bubbleWrapFeet)} ft bubble wrap, ${(mat.paperPadBoxes + override.paperPadBoxes)} paper pad boxes, ${(mat.dishPacks + override.dishPacks)} dish packs`, 10, yPos);
    yPos += 10;
  });
  doc.save(`${formData.clientName || 'quote'}_quote.pdf`);
}

function exportToCSV(formData, calculateEstimate) {
  const { low, high } = calculateEstimate();
  const headers = ['Client Name', 'Number of Movers', 'Labor Hours Low', 'Labor Hours High', 'Number of Vehicles', 'Mileage (miles)', 'Packing Service', 'Materials Cost', 'Total Low', 'Total High', 'Rooms'];
  const roomsStr = (formData.rooms || []).map(room =>
    `${room.name || 'Unnamed'} (${room.width || 'N/A'}x${room.length || 'N/A'}): Furniture - ${(room.furnitureItems || []).map(item => `${item.id}: ${item.name || 'Unknown'} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`).join('; ')}; Packing - ${(room.packingItems || []).map(item => `${item.id}: ${item.name || 'Unknown'} (${item.width || 'N/A'}x${item.length || 'N/A'}x${item.height || 'N/A'})`).join('; ')}; Materials - Boxes: ${(room.estimatedMaterials?.boxes || 0) + (room.overrideMaterials?.boxes || 0)}, Bubble: ${(room.estimatedMaterials?.bubbleWrapFeet || 0) + (room.overrideMaterials?.bubbleWrapFeet || 0)}ft, Paper Pads: ${(room.estimatedMaterials?.paperPadBoxes || 0) + (room.overrideMaterials?.paperPadBoxes || 0)}, Dish Packs: ${(room.estimatedMaterials?.dishPacks || 0) + (room.overrideMaterials?.dishPacks || 0)}`
  ).join(' | ');
  const row = [
    formData.clientName || '',
    formData.movers || 0,
    formData.hoursLow || 0,
    formData.hoursHigh || 0,
    formData.vehicles || 0,
    formData.mileage || 0,
    formData.packing || false,
    formData.materials || 0,
    low,
    high,
    roomsStr,
  ];
  const csv = [headers.join(','), row.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${formData.clientName || 'assessment'}_assessment.csv`;
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

async function getOrCreateClientFolder(clientName, accessToken, setDriveStatus) {
  if (!clientName || !accessToken) {
    setDriveStatus('Client name and access token are required');
    throw new Error('Client name and access token are required');
  }

  try {
    setDriveStatus('Checking for client folder...');
    const response = await window.gapi.client.drive.files.list({
      q: `name='${clientName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const folders = response.result.files;
    if (folders && folders.length > 0) {
      setDriveStatus(`Found existing folder: ${clientName}`);
      return folders[0].id;
    }

    setDriveStatus(`Creating new folder: ${clientName}`);
    const folderMetadata = {
      name: clientName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const folderResponse = await window.gapi.client.drive.files.create({
      resource: folderMetadata,
      fields: 'id',
    });

    setDriveStatus(`Created folder: ${clientName}`);
    return folderResponse.result.id;
  } catch (err) {
    setDriveStatus(`Failed to get or create folder: ${err.message}`);
    throw err;
  }
}

async function uploadFileToDrive(file, folderId, accessToken, roomName, itemId, setDriveStatus) {
  if (!file || !folderId || !accessToken) {
    setDriveStatus('File, folder ID, and access token are required');
    throw new Error('File, folder ID, and access token are required');
  }

  const fileName = `${roomName || 'Unnamed'}_${itemId || 'media'}_${Date.now()}.${file.type.split('/')[1]}`;
  setDriveStatus(`Uploading ${fileName}...`);

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: file.type,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  try {
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    setDriveStatus(`Successfully uploaded ${fileName}`);
    return await response.json();
  } catch (err) {
    setDriveStatus(`Failed to upload ${fileName}: ${err.message}`);
    throw err;
  }
}

async function saveToGoogleDrive(formData, accessToken, setDriveStatus) {
  if (!formData.clientName || !accessToken) {
    setDriveStatus('Please enter a client name and sign in with Google.');
    return;
  }

  if (!formData.rooms.some(room => room.photos.length > 0 || room.furnitureItems.some(item => item.photo))) {
    setDriveStatus('No photos or videos to upload.');
    return;
  }

  try {
    setDriveStatus('Initializing upload to Google Drive...');
    window.gapi.client.setToken({ access_token: accessToken });

    const folderId = await getOrCreateClientFolder(formData.clientName, accessToken, setDriveStatus);

    const filesToUpload = [];
    formData.rooms.forEach((room, roomIndex) => {
      room.photos.forEach((photoUrl, photoIndex) => {
        const byteString = atob(photoUrl.split(',')[1]);
        const mimeString = photoUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        filesToUpload.push({ file: blob, roomName: room.name, itemId: `RoomPhoto-${photoIndex + 1}` });
      });

      room.furnitureItems.forEach((item, itemIndex) => {
        if (item.photo) {
          const byteString = atob(item.photo.split(',')[1]);
          const mimeString = item.photo.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          filesToUpload.push({ file: blob, roomName: room.name, itemId: item.id });
        }
      });
    });

    for (const { file, roomName, itemId } of filesToUpload) {
      await uploadFileToDrive(file, folderId, accessToken, roomName, itemId, setDriveStatus);
    }

    setDriveStatus('All media files have been successfully uploaded to Google Drive!');
  } catch (err) {
    console.error('Failed to save to Google Drive:', err);
    setDriveStatus(`Failed to save to Google Drive: ${err.message}`);
  }
}