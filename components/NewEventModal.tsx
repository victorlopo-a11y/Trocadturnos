
import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, CheckCircle2, AlertCircle, Clock, Camera, Trash2, Image as ImageIcon, Play, Search } from 'lucide-react';
import { ShiftType, EventCategory, ShiftEvent } from '../types';
import { EVENT_METADATA } from '../constants';

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Fixed: Added 'sector' to Omit list to match handleSaveEvent signature in App.tsx
  onSave: (event: Omit<ShiftEvent, 'id' | 'timestamp' | 'userId' | 'userName' | 'date' | 'sector'>) => void;
  // Add initialData prop to support editing
  initialData?: ShiftEvent | null;
}

const NewEventModal: React.FC<NewEventModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [shift, setShift] = useState<ShiftType>(ShiftType.ADM);
  const [line, setLine] = useState('');
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [equipmentSubtype, setEquipmentSubtype] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solution, setSolution] = useState('');
  const [impact, setImpact] = useState('');
  const [downtime, setDowntime] = useState<string>('');
  const [releaseTime, setReleaseTime] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate state when initialData changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setShift(initialData.shift);
        setLine(initialData.line);
        setCategory(initialData.category);
        setEquipmentSubtype(initialData.equipmentSubtype || '');
        setTitle(initialData.title);
        setDescription(initialData.description);
        setSolution(initialData.solution || '');
        setImpact(initialData.impact || '');
        setDowntime(initialData.downtime?.toString() || '');
        setReleaseTime(initialData.releaseTime || '');
        setPhotos(initialData.photos || []);
      } else {
        // Reset to defaults for a new record
        setShift(ShiftType.ADM);
        setLine('');
        setCategory(null);
        setEquipmentSubtype('');
        setTitle('');
        setDescription('');
        setSolution('');
        setImpact('');
        setDowntime('');
        setReleaseTime('');
        setPhotos([]);
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const isTechnicalCategory = category === EventCategory.FERRAMENTA || 
                               category === EventCategory.PERIFERICOS || 
                               category === EventCategory.MAQUINA;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    // Fixed: The object passed here matches the Omit type above
    onSave({ 
      shift, 
      line, 
      category, 
      equipmentSubtype: isTechnicalCategory ? equipmentSubtype : undefined,
      title, 
      description, 
      solution, 
      impact, 
      downtime: downtime ? parseInt(downtime) : 0,
      releaseTime: releaseTime || undefined,
      photos 
    });
    
    // Reset handled by useEffect when closed/opened
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in duration-300 border border-transparent dark:border-slate-800">
        <div className="flex justify-between items-center p-8 border-b border-gray-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">{initialData ? 'Editar Relatório' : 'Novo Relatório'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{initialData ? 'Atualize os detalhes da ocorrência.' : 'Preencha os detalhes da ocorrência no turno.'}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-red-500">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Turno</label>
              <div className="relative">
                <select 
                  value={shift}
                  onChange={(e) => setShift(e.target.value as ShiftType)}
                  className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white appearance-none transition-all outline-none font-bold text-slate-700"
                >
                  {Object.values(ShiftType).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Linha / Equipamento</label>
              <input 
                type="text" 
                placeholder="Ex: Linha 1, Laser 04..."
                value={line}
                onChange={(e) => setLine(e.target.value)}
                required
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl transition-all outline-none font-bold text-slate-700 dark:text-white ${isDropdownOpen ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                >
                  {category ? (
                    <div className="flex items-center gap-3">
                      <span className={EVENT_METADATA[category].color}>{EVENT_METADATA[category].icon}</span>
                      <span>{category}</span>
                    </div>
                  ) : (
                    <span className="text-slate-300 dark:text-slate-600">Selecione</span>
                  )}
                  <ChevronDown size={20} className="text-slate-400" />
                </button>

                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-top-2 p-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {Object.entries(EVENT_METADATA).map(([key, meta]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCategory(key as EventCategory);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all text-left group"
                      >
                        <div className={`p-2.5 rounded-xl ${meta.bgColor} ${meta.color} group-hover:scale-110 transition-transform`}>
                          {meta.icon}
                        </div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{key}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isTechnicalCategory ? (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                   <Search size={14} className="text-indigo-400" /> Modelo / Tipo de {category}
                </label>
                <input 
                  type="text" 
                  placeholder={`Qual ${category.toLowerCase()}?`}
                  value={equipmentSubtype}
                  onChange={(e) => setEquipmentSubtype(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-indigo-50/30 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none font-bold text-slate-700 placeholder:text-indigo-200 dark:placeholder:text-indigo-900/40"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Clock size={14} className="text-red-400" /> Parada (min)
                  </label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={downtime}
                    onChange={(e) => setDowntime(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <Play size={14} className="text-emerald-500" /> Liberação
                  </label>
                  <input 
                    type="time" 
                    value={releaseTime}
                    onChange={(e) => setReleaseTime(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none font-bold text-slate-700"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Título da Ocorrência</label>
            <input 
              type="text" 
              placeholder="Resumo curto e direto"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none font-bold text-slate-700 placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição do Problema</label>
            <textarea 
              placeholder="Descreva detalhadamente o que foi encontrado..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white transition-all outline-none resize-none font-medium text-slate-600 dark:text-slate-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Solução Aplicada
              </label>
              <textarea 
                placeholder="Como foi resolvido?"
                rows={3}
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full px-5 py-4 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 dark:text-emerald-100 transition-all outline-none resize-none font-medium text-slate-600"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                <AlertCircle size={14} /> Impacto na Produção
              </label>
              <textarea 
                placeholder="Houve parada de linha?"
                rows={3}
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                className="w-full px-5 py-4 bg-amber-50/30 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 dark:text-amber-100 transition-all outline-none resize-none font-medium text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
              <Camera size={14} /> Evidências Fotográficas
            </label>
            
            <div className="flex flex-wrap gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                  <img src={photo} alt={`Evidência ${index + 1}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
              >
                <Camera size={24} />
                <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Add Foto</span>
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              multiple 
              className="hidden" 
            />
          </div>

          <div className="flex gap-4 pt-8">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!category || !title || !description || (isTechnicalCategory && !equipmentSubtype)}
            >
              {initialData ? 'Atualizar Registro' : 'Salvar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEventModal;
