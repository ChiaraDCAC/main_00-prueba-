const { SAData, SRLData, SHData, SucesionData, MonotributistaData, DatosGenerales, DatosGeneralesSociedades } = require('../models');

const modelMap = {
  sa: SAData,
  srl: SRLData,
  sh: SHData,
  sucesion: SucesionData,
  monotributista: MonotributistaData,
};

// GET /api/entity-data/:type/:id_sociedad
const getEntityData = async (req, res) => {
  try {
    const { type, id_sociedad } = req.params;
    const Model = modelMap[type];
    if (!Model) return res.status(400).json({ message: 'Tipo de entidad inválido' });

    const data = await Model.findOne({ where: { id_sociedad } });
    res.json(data || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/entity-data/:type/:id_sociedad
const saveEntityData = async (req, res) => {
  try {
    const { type, id_sociedad } = req.params;
    const Model = modelMap[type];
    if (!Model) return res.status(400).json({ message: 'Tipo de entidad inválido' });

    const pkMap = { sa: 'sa_id', srl: 'srl_id', sh: 'sh_id', sucesion: 'sucesion_id', monotributista: 'monotributista_id' };

    const payload = {
      ...req.body,
      id_sociedad,
      completadoPor: req.user?.id,
      completadoAt: new Date(),
    };

    const existing = await Model.findOne({ where: { id_sociedad } });
    if (existing) {
      await existing.update(payload);
      return res.json(existing);
    }

    const record = await Model.create(payload);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/datos-generales/:uuid
const getDatosGenerales = async (req, res) => {
  try {
    const { uuid } = req.params;
    const data = await DatosGenerales.findByPk(uuid, {
      include: [{ model: DatosGeneralesSociedades, as: 'sociedades' }],
    });
    if (!data) return res.status(404).json({ message: 'No encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/datos-generales
const createDatosGenerales = async (req, res) => {
  try {
    const record = await DatosGenerales.create(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/datos-generales/:uuid/sociedades
const linkSociedad = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { id_sociedad, rol } = req.body;
    const record = await DatosGeneralesSociedades.create({ uuid, id_sociedad, rol });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEntityData, saveEntityData, getDatosGenerales, createDatosGenerales, linkSociedad };
