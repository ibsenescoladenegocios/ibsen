import { formatDate } from '../../lib/utils.js';

const Row = ({ icon, children, last }) => (
  <div className={`flex items-start ${last ? '' : 'mb-4'}`}>
    <i className={`fas ${icon} mr-3 mt-1 text-primary`} />
    <span>{children}</span>
  </div>
);

export default function Agenda({ items }) {
  return (
    <section id="agenda" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Agenda</h2>
        {items.length === 0 ? (
          <p className="text-center text-gray-600">Em breve novos eventos. Acompanhe por aqui.</p>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {items.map((e) => (
              <div key={e.id} className="overflow-hidden rounded-lg bg-white shadow-md transition duration-300 hover:shadow-lg">
                <div className="bg-green-600 px-6 py-4 text-white">
                  <h3 className="text-xl font-bold">{e.title}</h3>
                </div>
                <div className="p-6">
                  {e.address && <Row icon="fa-map-marker-alt">{e.address}</Row>}
                  <Row icon="fa-calendar-alt">{formatDate(e.event_date)}</Row>
                  {e.event_time && <Row icon="fa-clock">{e.event_time}</Row>}
                  {e.phone && <Row icon="fa-phone" last>{e.phone}</Row>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
