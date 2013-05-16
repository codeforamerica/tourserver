# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20130516183540) do

  create_table "chapters", :force => true do |t|
    t.integer  "tour_id"
    t.integer  "interest_point_id"
    t.integer  "position"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
  end

  create_table "interest_point_items", :force => true do |t|
    t.integer  "interest_point_id"
    t.integer  "interp_item_id"
    t.integer  "position"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
  end

  create_table "interest_points", :force => true do |t|
    t.string   "name"
    t.datetime "created_at",                                          :null => false
    t.datetime "updated_at",                                          :null => false
    t.spatial  "location",   :limit => {:srid=>3785, :type=>"point"}
  end

  create_table "interp_items", :force => true do |t|
    t.string   "name"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "media_items", :force => true do |t|
    t.integer  "position"
    t.string   "mimetype"
    t.string   "name"
    t.integer  "interp_item_id"
    t.datetime "created_at",        :null => false
    t.datetime "updated_at",        :null => false
    t.string   "item_file_name"
    t.string   "item_content_type"
    t.integer  "item_file_size"
    t.datetime "item_updated_at"
  end

  create_table "tours", :force => true do |t|
    t.string   "name"
    t.string   "difficulty"
    t.integer  "tourtime"
    t.datetime "created_at",                                                              :null => false
    t.datetime "updated_at",                                                              :null => false
    t.spatial  "path",                     :limit => {:srid=>3785, :type=>"line_string"}
    t.text     "description"
    t.string   "cover_image_file_name"
    t.string   "cover_image_content_type"
    t.integer  "cover_image_file_size"
    t.datetime "cover_image_updated_at"
  end

end
