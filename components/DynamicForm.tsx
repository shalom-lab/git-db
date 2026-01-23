
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
    
    // 转换数据格式以适配 SQLite
    const processedData: any = {};
    columns.forEach(col => {
      const value = formData[col.name];
      const typeUpper = col.type.toUpperCase();
      
      // BOOLEAN: true/false → 1/0
      if (typeUpper.includes('BOOL')) {
        if (value === true || value === 1 || value === '1') {
          processedData[col.name] = 1;
        } else if (value === false || value === 0 || value === '0') {
          processedData[col.name] = 0;
        } else {
          processedData[col.name] = value; // null 或其他值保持原样
        }
      }
      // DATETIME/TIMESTAMP: 转换 datetime-local 格式 (YYYY-MM-DDTHH:MM) → SQLite 格式 (YYYY-MM-DD HH:MM:SS)
      else if (typeUpper.includes('DATETIME') || typeUpper.includes('TIMESTAMP')) {
        if (value && typeof value === 'string' && value.includes('T')) {
          // 将 "YYYY-MM-DDTHH:MM" 转换为 "YYYY-MM-DD HH:MM:SS"
          const [datePart, timePart] = value.split('T');
          if (timePart) {
            const timeParts = timePart.split(':');
            // 确保有秒数部分
            const timeWithSeconds = timeParts.length === 2 
              ? `${timePart}:00` 
              : timePart;
            processedData[col.name] = `${datePart} ${timeWithSeconds}`;
          } else {
            processedData[col.name] = `${datePart} 00:00:00`;
          }
        } else {
          processedData[col.name] = value;
        }
      }
      // 其他类型直接使用原值
      else {
        processedData[col.name] = value;
      }
    });
    
    onSave(processedData);
  };

  const getFieldType = (col: ColumnInfo): { inputType: string; isCheckbox: boolean } => {
    const typeUpper = col.type.toUpperCase();
    
    // BOOLEAN 类型
    if (typeUpper.includes('BOOL')) {
      return { inputType: 'checkbox', isCheckbox: true };
    }
    
    // DATE 类型（不包含 TIME）
    if (typeUpper.includes('DATE') && !typeUpper.includes('TIME') && !typeUpper.includes('TIMESTAMP')) {
      return { inputType: 'date', isCheckbox: false };
    }
    
    // DATETIME/TIMESTAMP 类型
    if (typeUpper.includes('DATETIME') || typeUpper.includes('TIMESTAMP')) {
      return { inputType: 'datetime-local', isCheckbox: false };
    }
    
    // INTEGER/NUMERIC 类型
    if (typeUpper.includes('INT') || typeUpper.includes('NUM')) {
      return { inputType: 'number', isCheckbox: false };
    }
    
    // 默认文本类型
    return { inputType: 'text', isCheckbox: false };
  };

  const formatValueForInput = (col: ColumnInfo, value: any): string => {
    const typeUpper = col.type.toUpperCase();
    
    // DATETIME/TIMESTAMP: 将 "YYYY-MM-DD HH:MM:SS" 转换为 "YYYY-MM-DDTHH:MM" (datetime-local 格式)
    if ((typeUpper.includes('DATETIME') || typeUpper.includes('TIMESTAMP')) && value) {
      if (typeof value === 'string' && value.includes(' ')) {
        const [datePart, timePart] = value.split(' ');
        if (timePart) {
          const timeParts = timePart.split(':');
          // datetime-local 只需要日期和时分，不需要秒
          const hours = timeParts[0] || '00';
          const minutes = timeParts[1] || '00';
          return `${datePart}T${hours}:${minutes}`;
        }
        return datePart;
      }
    }
    
    return value || '';
  };

  const renderField = (col: ColumnInfo) => {
    const isPk = col.pk === 1;
    const disabled = isPk && !!initialData;
    const { inputType, isCheckbox } = getFieldType(col);
    const typeUpper = col.type.toUpperCase();
    
    // BOOLEAN 字段使用 checkbox
    if (isCheckbox) {
      const boolValue = formData[col.name] === 1 || formData[col.name] === '1' || formData[col.name] === true;
      
      return (
        <div key={col.name} className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {col.name} 
            {col.notnull === 1 && <span className="text-red-500 ml-1">*</span>}
            {isPk && <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] rounded uppercase font-bold tracking-wider">PK</span>}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              disabled={disabled}
              checked={boolValue}
              onChange={(e) => handleChange(col.name, e.target.checked)}
              className="w-5 h-5 text-primary border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {boolValue ? (lang === Language.EN ? 'True' : '是') : (lang === Language.EN ? 'False' : '否')}
            </span>
          </div>
          {col.type && <p className="text-[10px] text-gray-400 uppercase">{col.type}</p>}
        </div>
      );
    }
    
    // 其他类型使用普通 input
    const inputValue = typeUpper.includes('DATETIME') || typeUpper.includes('TIMESTAMP')
      ? formatValueForInput(col, formData[col.name])
      : (formData[col.name] || '');
    
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
          value={inputValue}
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
