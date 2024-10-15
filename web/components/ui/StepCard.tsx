interface StepCardProps {
  number: string;
  title: string;
  description: string;
}
export function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="bg-gray-900 p-6 rounded-lg flex items-start">
      <div className="bg-violet-900 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}
