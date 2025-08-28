import { useState } from 'react';
export default function NewProductPage() { const [title, setTitle] = useState(''); const [price, setPrice] = useState(''); const [category, setCategory] = useState(''); const [desc, setDesc] = useState(''); const [loc, setLoc] = useState(null); const [saving, setSaving] = useState(false); const [files, setFiles] = useState([]); const [progress, setProgress] = useState(0); const onSubmit = async (e) => { e.preventDefault(); if (!title)
    return alert('?�목???�력?�세??);    if (!loc) return alert(', 거래 ?  : ); }; }
