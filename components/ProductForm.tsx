"use client";
import { useActionState } from "react";
import { saveProductAction } from "@/app/admin/actions";
import type { Product } from "@/lib/catalog";

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const sizes = product ? product.sizes.filter((s) => s.stock > 0).map((s) => (s.stock > 1 ? `${s.size}:${s.stock}` : s.size)).join(", ") : "";
  const art = product?.art ?? ["#ffffff", "#ff5a1f", "#111111"];
  return (
    <form action={action} className="panel" encType="multipart/form-data" style={{ maxWidth: 760 }}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="formgrid">
        <div className="field"><label htmlFor="brand">Бренд</label><input id="brand" name="brand" type="text" required maxLength={40} defaultValue={product?.brand} placeholder="Nike" /></div>
        <div className="field"><label htmlFor="name">Название</label><input id="name" name="name" type="text" required maxLength={80} defaultValue={product?.name} placeholder="Alphafly 3" /></div>
        <div className="field"><label htmlFor="category">Категория</label>
          <select id="category" name="category" className="inp" defaultValue={product?.category ?? "running"}>
            <option value="running">Беговая обувь</option><option value="apparel">Одежда</option><option value="team">Форма сборной</option><option value="lifestyle">Повседневная обувь</option>
          </select></div>
        <div className="field"><label htmlFor="kind">Тип (для рисунка и размеров)</label>
          <select id="kind" name="kind" className="inp" defaultValue={product?.kind ?? "shoe"}>
            <option value="shoe">Обувь</option><option value="shorts">Шорты</option><option value="singlet">Майка</option><option value="jacket">Куртка</option><option value="tee">Футболка</option><option value="tights">Тайтсы</option>
          </select></div>
        <div className="field"><label htmlFor="price">Цена, €</label><input id="price" name="price" type="number" required min={1} max={5000} step="0.01" defaultValue={product ? product.priceCents / 100 : undefined} /></div>
        <div className="field"><label htmlFor="bg">Цвет фона плитки</label><input id="bg" name="bg" type="color" defaultValue={product?.bg ?? "#e7e7e1"} style={{ height: 44, padding: 4 }} /></div>
        <div className="field full"><label htmlFor="sizes">Размеры и количество</label><input id="sizes" name="sizes" type="text" required maxLength={400} defaultValue={sizes} placeholder="40, 41, 42:2, 43" />
          <span className="hint">Через запятую. «42:2» — два размера 42. Без числа — одна пара. Это то, что есть в наличии сейчас.</span></div>
        <div className="field full"><label htmlFor="photo">Фото (JPEG, PNG или WebP, до 6 МБ)</label><input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
          {product?.imageUrl && <label className="hint"><input type="checkbox" name="removePhoto" /> Удалить текущее фото</label>}
          <span className="hint">Пока нет фото, на витрине показывается рисунок. Цвета рисунка ниже.</span></div>
        <div className="field"><label>Цвета рисунка (если нет фото)</label>
          <div className="rowflex">{["a0", "a1", "a2"].map((k, i) => <input key={k} name={k} type="color" defaultValue={art[i] ?? "#111111"} style={{ width: 56, height: 40, padding: 3 }} aria-label={`Цвет ${i + 1}`} />)}</div></div>
        <div className="field full"><label htmlFor="descEn">Описание (English)</label><textarea id="descEn" name="descEn" maxLength={1500} defaultValue={product?.descEn} /></div>
        <div className="field full"><label htmlFor="descLt">Aprašymas (lietuvių)</label><textarea id="descLt" name="descLt" maxLength={1500} defaultValue={product?.descLt} /></div>
        <label className="full rowflex"><input type="checkbox" name="active" defaultChecked={product?.active ?? true} /> Показывать на витрине</label>
      </div>
      <div className="err" role="alert">{state?.error}</div>
      <button className="btn solid" type="submit" disabled={pending}>{pending ? "Сохраняю…" : "Сохранить"}</button>
    </form>
  );
}
