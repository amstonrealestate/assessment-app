const { useState, useEffect, useCallback } = React;

// Main App component
function App() {
  const [rates, setRates] = useState(() => {
    const savedRates = localStorage.getItem('rates');
    return savedRates ? JSON.parse(savedRates) : {
      moverHourly: 75,
      vehicleFlat: 50,
      mileageRate: 1,
      packingFee: 200,
      itemHandling: 0,
      materialsCost: 0,
      bubbleWrapCostPerFoot: 0.4,
      boxCost: 4,
      paperPadCostPerBox: 23.75,
      dishPackCost: 4.3,
    };
  });

  const [formData, setFormData] = useState({
    clientName: '',
    rooms: [
      {
        name: 'Living Room',
        width: '',
        length: '',
        furnitureItems: [],
        packingItems: [],
        photos: [],
        estimatedMaterials: { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 },
        overrideMaterials: { boxes: 0, bubbleWrapFeet: 0, paperPadBoxes: 0, dishPacks: 0 },
      }
    ],
    movers: 2,
    hoursLow: 4,
    hoursHigh: 5,
    vehicles: 1,
    mileage: 10,
    packing: false,
    materials: 0,
  });

  const [model, setModel] = useState(null);
  const [loadingModel, setLoadingModel] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState(0);
  const [itemCounter, setItemCounter] = useState(1);

  useEffect(() => {
    cocoSsd.load().then(loadedModel => {
      setModel(loadedModel);
      setLoadingModel(false);
    }).catch(err => console.error('Model loading failed:', err));
  }, []);

  useEffect(() => {
    localStorage.setItem('rates', JSON.stringify(rates));
  }, [rates]);

  // Google Sign-In
  const handleCredentialResponse = useCallback((response) => {
    const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
    setUser({
      name: userInfo.name,
      email: userInfo.email,
      picture: userInfo.picture,
    });
  }, []);

  useEffect(() => {
    window.google?.accounts.id.initialize({
      client_id: '534251225749-b7rjflroua415i616iopie6s09sp1isd.apps.googleusercontent.com',
      callback: handleCredentialResponse,
      auto_select: false,
    });

    window.google?.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      {
        theme: 'outline',
        size: 'large',
        text: 'sign_in_with',
        shape: 'rectangular',
      }
    );

    window.google?.accounts.id.prompt();
  }, [handleCredentialResponse]);

  const handleSignOut = () => {
    setUser(null);
    window.google?.accounts.id.disableAutoSelect();
  };

  const handleRateChange = (e) => {
    setRates({ ...rates, [e.target.name]: parseFloat(e.target.value) || 0 });
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

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Assessment App</h1>

      {/* Google Sign-In */}
      <div className="mb-6 p-4 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Sign In</h2>
        {user ? (
          <div>
            <p>Welcome, {user.name} ({user.email})</p>
            <img src={user.picture} alt="Profile" className="w-12 h-12 rounded-full mb-2" />
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div id="google-signin-button"></div>
        )}
      </div>

      {/* Configuration Settings */}
      <div className="mb-6 p-4 border rounded bg-white">
        <h2 className="text-lg font-semibold mb-2">Configuration Settings</h2>
        <p className="text-sm text-gray-600 mb-2">Adjust rates (saved locally for future use)</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(rates).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
              <input
                type="number"
                name={key}
                value={value}
                onChange={handleRateChange}
                className="w-full p-2 border rounded"
                step={key.includes('CostPer') || key === 'mileageRate' ? '0.01' : '1'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Client Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Client Name</label>
        <input
          type="text"
          name="clientName"
          value={formData.clientName}
          onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
          className="w-full p-2 border rounded"
          placeholder="Enter client name"
          required
        />
      </div>

      {/* Rooms */}
      <RoomForm
        formData={formData}
        setFormData={setFormData}
        model={model}
        loadingModel={loadingModel}
        itemCounter={itemCounter}
        setItemCounter={setItemCounter}
      />

      {/* Estimate Details */}
      {formData && rates && (
        <EstimateDetails
          formData={formData}
          setFormData={setFormData}
          rates={rates}
          calculateEstimate={calculateEstimate}
          generatePDF={generatePDF}
          exportToCSV={exportToCSV}
        />
      )}

      {/* Room Visualization */}
      <RoomVisualization
        formData={formData}
        selectedRoomIndex={selectedRoomIndex}
        setSelectedRoomIndex={setSelectedRoomIndex}
      />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));