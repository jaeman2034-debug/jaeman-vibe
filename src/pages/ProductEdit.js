import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
export default function ProductEdit() { const params = useParams(); const { id } = params; const nav = useNavigate(); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [form, setForm] = useState < { title: string, price: number, description: string, category: string, status: "?�매�? | " ?  :  }; }
