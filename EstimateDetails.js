function EstimateDetails({ formData, setFormData, rates, calculateEstimate, generatePDF, exportToCSV }) {
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.name === 'packing' ? e.target.checked : e.target.value });
  };

  // Only calculate estimate if formData and rates are defined
  const estimate = formData && rates ? calculateEstimate(formData, rates) : { low: '0.00', high: '0.00' };

  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Estimate Details</h2>
      <div className="grid grid-cols-2 gap-2">
        {['movers', 'vehicles', 'hoursLow', 'hoursHigh', 'mileage', 'materials'].map(field => (
          <div key={field}>
            <label className="block text-sm font-medium">
              {field === 'hoursLow' ? 'Labor Hours Low' :
               field === 'hoursHigh' ? 'Labor Hours High' :
               field === 'mileage' ? 'Mileage (miles)' :
               field === 'materials' ? 'Additional Materials Cost ($)' :
               field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </label>
            <input
              type={field === 'materials' ? 'number' : 'number'}
              name={field}
              value={formData[field] || ''}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            />
          </div>
        ))}
      </div>
      <label className="flex items-center mt-2">
        <input
          type="checkbox"
          name="packing"
          checked={formData.packing || false}
          onChange={handleInputChange}
          className="mr-2"
        />
        Packing Service Needed
      </label>
      <div className="mt-4">
        <h2 className="text-lg font-semibold">Estimate: ${estimate.low} - ${estimate.high}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => generatePDF(formData, () => calculateEstimate(formData, rates))}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={!formData || !rates}
          >
            Download Quote PDF
          </button>
          <button
            onClick={() => exportToCSV(formData, () => calculateEstimate(formData, rates))}
            className="bg-gray-500 text-white px-4 py-2 rounded"
            disabled={!formData || !rates}
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  );
}