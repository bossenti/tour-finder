# coding=utf-8

from sqlalchemy import Column, String, ForeignKey, Integer, Float
from marshmallow import Schema, fields
from sqlalchemy.orm import relationship

from .entity import Entity, Base


class Location(Entity, Base):
    __tablename__ = 'locations'

    lat = Column(Float, nullable=False)
    long = Column(Float, nullable=False)
    name = Column(String, nullable=False)
    location_type_id = Column(Integer, ForeignKey('location_types.id'), nullable=False)
    location_type = relationship('LocationType', foreign_keys=location_type_id)
    region_id = Column(Integer, ForeignKey('regions.id'), nullable=False)
    region = relationship('Region', foreign_keys=region_id)
    linked_activities = relationship('LocationActivity', uselist=True, backref='locations')

    def __init__(self, lat, long, name, location_type_id, region_id, created_by):
        Entity.__init__(self, created_by)
        self.lat = lat
        self.long = long
        self.name = name
        self.location_type_id = location_type_id
        self.region_id = region_id


class LocationSchema(Schema):
    id = fields.Integer()
    lat = fields.Float()
    long = fields.Float()
    name = fields.String()
    location_type_id = fields.Integer()
    region_id = fields.Integer()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
    last_updated_by = fields.String()