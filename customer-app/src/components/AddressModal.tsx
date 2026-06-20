'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Navigation, ArrowLeft, Home, User, Phone } from 'lucide-react';
import { Society, Address, dbService } from '../utils/db';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSaved: (address: Address) => void;
  addresses: Address[];
  activeAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  currentUser?: { name: string; phone: string } | null;
}

export default function AddressModal({
  isOpen,
  onClose,
  onAddressSaved,
  addresses,
  activeAddress,
  onAddressSelect,
  currentUser,
}: AddressModalProps) {
  const [step, setStep] = useState<'select' | 'society' | 'details'>('select');
  const [societies, setSocieties] = useState<Society[]>([]);
  const [filteredSocieties, setFilteredSocieties] = useState<Society[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);

  // Form fields
  const [flatNo, setFlatNo] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  // Reset or set step depending on whether saved addresses exist when modal opens
  useEffect(() => {
    if (isOpen) {
      if (addresses && addresses.length > 0) {
        setStep('select');
      } else {
        setStep('society');
      }

      // Prefill recipient details if currentUser is logged in
      if (currentUser) {
        setName(currentUser.name || '');
        setPhone(currentUser.phone || '');
      } else {
        setName('');
        setPhone('');
      }
    }
  }, [isOpen, addresses, currentUser]);

  useEffect(() => {
    const fetchSocieties = async () => {
      const list = await dbService.getSocieties();
      setSocieties(list);
      setFilteredSocieties(list);
    };
    fetchSocieties();
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredSocieties(societies);
    } else {
      setFilteredSocieties(
        societies.filter(s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.sector && s.sector.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );
    }
  }, [searchQuery, societies]);

  if (!isOpen) return null;

  const handleSelectSociety = (society: Society) => {
    setSelectedSociety(society);
    setStep('details');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSociety || !flatNo || !name || !phone) {
      alert('Please fill out all fields.');
      return;
    }

    const saved = await dbService.saveAddress({
      society_id: selectedSociety.id,
      society_name: selectedSociety.name,
      flat_house_no: flatNo,
      name,
      phone,
      is_default: isDefault,
    });

    onAddressSaved(saved);
    // Reset Form
    setFlatNo('');
    setName('');
    setPhone('');
    setSelectedSociety(null);
    setStep('select');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans flex items-center justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {step === 'details' && (
              <button
                type="button"
                onClick={() => setStep('society')}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 mr-1"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            {step === 'society' && addresses && addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500 mr-1"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-base font-bold text-gray-900">
              {step === 'select' ? 'Choose Delivery Location' : step === 'society' ? 'Select Society' : 'Enter Address Details'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        {step === 'select' ? (
          /* STEP 0: CHOOSE SAVED ADDRESS */
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
            {/* List of saved addresses */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-1">
                Saved Addresses
              </span>
              <div className="space-y-2.5">
                {addresses.map((addr) => {
                  const isActive = activeAddress?.id === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => {
                        onAddressSelect(addr);
                        onClose();
                      }}
                      type="button"
                      className={`w-full bg-white border rounded-2xl p-4 flex items-start space-x-3 text-left transition-all hover:shadow-xs relative ${
                        isActive
                          ? 'border-[#1e7e34] bg-green-50/10'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-[#1e7e34]/10 text-[#1e7e34]' : 'bg-gray-50 text-gray-400'
                      }`}>
                        <MapPin size={18} />
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {addr.name}
                          </span>
                          {addr.is_default && (
                            <span className="text-[8px] bg-green-100 text-green-700 font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                              Default
                            </span>
                          )}
                          {isActive && (
                            <span className="text-[8px] bg-[#1e7e34] text-white font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 mt-1">
                          {addr.flat_house_no}, {addr.society_name}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          Mobile: {addr.phone}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Add New Button */}
            <div className="bg-white border-t border-gray-100 p-4 shrink-0 shadow-lg">
              <button
                onClick={() => setStep('society')}
                type="button"
                className="w-full bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-98 text-sm flex items-center justify-center space-x-2"
              >
                <span>+ Add New Address</span>
              </button>
            </div>
          </div>
        ) : step === 'society' ? (
          /* STEP 1: SELECT SOCIETY */
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
            {/* Auto-detecting banner */}
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="bg-[#1e7e34]/5 border border-[#1e7e34]/10 rounded-2xl p-3.5 flex flex-col items-center text-center">
                <Navigation size={22} className="text-[#1e7e34] animate-bounce mb-1" />
                <h3 className="text-sm font-bold text-gray-900">Auto-detecting your society</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  We've detected your society based on your current location. Please confirm.
                </p>
                <button
                  type="button"
                  onClick={() => handleSelectSociety(societies[3] || societies[0])} // Default mock selection
                  className="mt-2.5 bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-xs"
                >
                  Confirm Current Location
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search your society..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 text-gray-800 placeholder-gray-400 pl-10 pr-4 py-2.5 rounded-xl text-xs border border-gray-100 focus:outline-none focus:ring-1 focus:ring-[#1e7e34]"
                />
              </div>
            </div>

            {/* Societies List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase pl-1">
                Supported Societies
              </span>
              {filteredSocieties.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">No society found matching "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-[#1e7e34] text-xs font-bold hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                filteredSocieties.map((society) => (
                  <button
                    key={society.id}
                    onClick={() => handleSelectSociety(society)}
                    type="button"
                    className="w-full bg-white border border-gray-100 hover:border-[#1e7e34]/30 rounded-2xl p-3.5 flex items-start space-x-3 text-left transition-all hover:shadow-xs group"
                  >
                    <div className="p-2 bg-[#1e7e34]/5 text-[#1e7e34] rounded-xl shrink-0 group-hover:bg-[#1e7e34] group-hover:text-white transition-colors">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#1e7e34] transition-colors">
                        {society.name}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {society.sector ? `${society.sector}, ` : ''}{society.city} - {society.pincode}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* STEP 2: ENTER DETAILS FORM */
          <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between overflow-hidden bg-gray-50">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              
              {/* Selected Society Badge */}
              <div className="bg-white rounded-2xl border border-gray-100 p-3 flex items-start space-x-2.5">
                <MapPin size={18} className="text-[#1e7e34] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#1e7e34] font-bold tracking-wider uppercase">Selected Area</span>
                  <h4 className="text-xs font-bold text-gray-900">{selectedSociety?.name}</h4>
                  <p className="text-[10px] text-gray-400">{selectedSociety?.sector ? `${selectedSociety.sector}, ` : ''}{selectedSociety?.city} - {selectedSociety?.pincode}</p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-3.5">
                {/* Flat no */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                    <Home size={12} className="text-gray-400" />
                    <span>Flat / House No, Floor, Tower / Building</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tower B, Flat 405"
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] focus:border-transparent"
                  />
                </div>

                {/* Recipient name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                    <User size={12} className="text-gray-400" />
                    <span>Recipient Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vijay Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] focus:border-transparent"
                  />
                </div>

                {/* Phone number */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center space-x-1">
                    <Phone size={12} className="text-gray-400" />
                    <span>Recipient Mobile Number</span>
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="e.g. 9509122472"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1e7e34] focus:border-transparent"
                  />
                  <p className="text-[9px] text-gray-400">Must be a valid 10-digit mobile number</p>
                </div>

                {/* Toggle default address */}
                <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 mt-2">
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Set as default address</h5>
                    <p className="text-[10px] text-gray-400">Use this address for all future deliveries</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1e7e34]"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Save Action */}
            <div className="bg-white border-t border-gray-100 p-4 shrink-0 shadow-lg">
              <button
                type="submit"
                className="w-full bg-[#1e7e34] hover:bg-[#155a24] text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-98 text-sm"
              >
                Save Address & Proceed
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
