interface Props {
  label: string;
  nilai: string;
  ikon: string;
  kecil?: boolean; // untuk nilai panjang seperti Rupiah
}

export default function KartuStatistik({ label, nilai, ikon, kecil }: Props) {
  return (
    <div className="card text-center py-4 px-2">
      <div className="text-2xl mb-1">{ikon}</div>
      <div className={`font-bold text-batik-700 leading-tight ${kecil ? "text-base" : "text-2xl"}`}>
        {nilai}
      </div>
      <div className="text-gray-500 text-xs mt-1">{label}</div>
    </div>
  );
}
