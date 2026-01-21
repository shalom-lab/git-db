
import React, { useState, useEffect } from 'react';
import { ColumnInfo, Language } from '../types';
import { I18N, ICONS } from '../constants';

interface DynamicFormProps {
  columns: ColumnInfo[];
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  lang: Language;
}

const DynamicForm: React.FC<DynamicFormProps> = ({ columns, initialData, onSave, onCancel, lang }) => {
  const [formData, setFormData] = useState<any>(initialData || {});
  const t = I18N[lang].actions;

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      const defaults: any = {};
      columns.forEach(col => {
        if (col.dflt_value !== null) defaults[col.name] = col.dflt_value;
      });
      setFormData(defaults);
    }
  }, [initialData, columns]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const renderField = (col: ColumnInfo) => {
    const isPk = col.pk === 1;
    // Don't allow editing PK if it's an update (standard practice for simple UI)
    const disabled = isPk && !!initialData;
    
    let inputType = "text";
    if (col.type.toUpperCase().includes("INT") || col.type.toUpperCase().includes("NUM")) inputType = "number";
    
    return (
      <div key={col.name} className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {col.name} 
          {col.notnull === 1 && <span className="text-red-500 ml-1">*</span>}
          {isPk && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] rounded uppercase font-bold tracking-wider">PK</span>}
        </label>
        <input
          type={inputType}
          disabled={disabled}
          required={col.notnull === 1}
          value={formData[col.name] || ''}
          onChange={(e) => handleChange(col.name, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {col.type && <p className="text-[10px] text-gray-400 uppercase">{col.type}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {columns.map(renderField)}
        </div>
        
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/20 flex items-center space-x-2"
          >
            {ICONS.Save}
            <span>{t.confirm}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicForm;
