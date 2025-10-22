import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AICard({
  title,
  summary,
  details,
}: {
  title: string;
  summary: string;
  details: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-2xl shadow hover:shadow-lg cursor-pointer transition-all"
        onClick={() => setOpen(true)}
      >
        <div className="text-gray-600 text-sm">{title}</div>
        <div className="font-bold text-lg text-blue-600 mt-1">{summary}</div>
        <div className="text-xs text-gray-500 mt-2">?¥Î¶≠?òÏó¨ ?ÅÏÑ∏ Î∂ÑÏÑù Î≥¥Í∏∞</div>
      </motion.div>

      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-2xl w-[500px] max-w-[90vw] space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">{title} ?ÅÏÑ∏ Î∂ÑÏÑù</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                √ó
              </button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-semibold text-blue-800 mb-2">?§ñ AI Î∂ÑÏÑù ?îÏïΩ</div>
              <div className="text-blue-700">{summary}</div>
            </div>
            
            <div>
              <div className="font-semibold text-gray-700 mb-3">?ìä ?ÅÏÑ∏ ÏßÄ??/div>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                {details.map((d, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-blue-500 mr-2">??/span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white rounded-xl px-4 py-2 transition-colors"
              >
                Ï∑®ÏÜå
              </button>
              <button
                onClick={() => setOpen(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2 transition-colors"
              >
                ?ïÏù∏
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
